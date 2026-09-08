import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { resolveDataBackend } from '@/lib/data/resolve-backend'

export type RegionStatus = 'closed' | 'waitlist' | 'open'

export type ConsumerAccessResult =
  | { allowed: true; status: RegionStatus | 'demo' | 'unconfigured' }
  | {
      allowed: false
      status: RegionStatus | 'unknown'
      city: string
      error: string
      waitlistPath: string
    }

function normalizeCity(city: string): string {
  return city.trim().replace(/\s+/g, ' ')
}

/**
 * Private consumer create-request gate.
 * Partner / Bamakor jobs must NOT call this — they are always allowed.
 *
 * Demo / mock backends stay open so local UI and investor demos work.
 * Missing launch_regions row → treated as waitlist (not open).
 */
export async function assertConsumerRegionOpen(
  city: string | null | undefined,
): Promise<ConsumerAccessResult> {
  if (resolveDataBackend() === 'mock' || isDemoDataMode()) {
    return { allowed: true, status: 'demo' }
  }

  const normalized = city ? normalizeCity(city) : ''
  if (!normalized) {
    return {
      allowed: false,
      status: 'unknown',
      city: '',
      error: 'יש לציין עיר כדי לבדוק אם האזור פתוח לצרכנים',
      waitlistPath: '/waitlist',
    }
  }

  const supabase =
    getAdminSupabaseClient() ?? (await createServerSupabaseClient())
  if (!supabase) {
    // Without DB we cannot verify density — fail closed for real consumer path
    return {
      allowed: false,
      status: 'unknown',
      city: normalized,
      error: 'לא ניתן לאמת פתיחת אזור כרגע',
      waitlistPath: `/waitlist?city=${encodeURIComponent(normalized)}`,
    }
  }

  const { data, error } = await supabase
    .from('launch_regions')
    .select('status, city')
    .is('category_id', null)
    .ilike('city', normalized)
    .maybeSingle()

  if (error) {
    // Table may not exist yet — fail closed for consumers
    console.warn('[regions] launch_regions query', error.message)
    return {
      allowed: false,
      status: 'unknown',
      city: normalized,
      error: 'האזור עדיין לא פתוח לצרכנים פרטיים — הצטרפו לרשימת ההמתנה',
      waitlistPath: `/waitlist?city=${encodeURIComponent(normalized)}`,
    }
  }

  const status = (data?.status as RegionStatus | undefined) ?? 'waitlist'

  if (status === 'open') {
    return { allowed: true, status: 'open' }
  }

  return {
    allowed: false,
    status,
    city: normalized,
    error:
      status === 'closed'
        ? 'האזור עדיין סגור לצרכנים פרטיים — Fixly נפתחת לפי צפיפות מקומית'
        : 'האזור ברשימת המתנה — נעדכן כשיש צפיפות מספקת של אנשי מקצוע ועבודות',
    waitlistPath: `/waitlist?city=${encodeURIComponent(normalized)}`,
  }
}

export async function listLaunchRegions(): Promise<
  {
    id: string
    city: string
    status: RegionStatus
    minPros: number
    minCompletedJobs30d: number
    notes: string | null
  }[]
> {
  const supabase =
    getAdminSupabaseClient() ?? (await createServerSupabaseClient())
  if (!supabase) return []

  const { data } = await supabase
    .from('launch_regions')
    .select('id, city, status, min_pros, min_completed_jobs_30d, notes')
    .order('city')

  return (data ?? []).map((row) => ({
    id: row.id as string,
    city: row.city as string,
    status: row.status as RegionStatus,
    minPros: Number(row.min_pros ?? 20),
    minCompletedJobs30d: Number(row.min_completed_jobs_30d ?? 30),
    notes: (row.notes as string) ?? null,
  }))
}

export async function upsertLaunchRegion(input: {
  city: string
  status: RegionStatus
  minPros?: number
  minCompletedJobs30d?: number
  notes?: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getAdminSupabaseClient()
  if (!admin) return { ok: false, error: 'Admin client unavailable' }

  const city = normalizeCity(input.city)
  const { data: existing } = await admin
    .from('launch_regions')
    .select('id')
    .is('category_id', null)
    .ilike('city', city)
    .maybeSingle()

  const patch = {
    city,
    status: input.status,
    min_pros: input.minPros ?? 20,
    min_completed_jobs_30d: input.minCompletedJobs30d ?? 30,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await admin
      .from('launch_regions')
      .update(patch)
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const { error } = await admin.from('launch_regions').insert({
    ...patch,
    category_id: null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
