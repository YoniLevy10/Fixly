import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mapProfessionalRow } from '@/lib/data/supabase-mappers'
import type { Professional } from '@/types/professional'

/** Columns present on all Fixly DBs (pre-Midrag). */
const PRO_SELECT_CORE = `
  id,
  title,
  description,
  category_id,
  rating,
  reviews_count,
  hourly_price,
  city,
  available,
  profile_image,
  phone,
  whatsapp_number,
  is_verified,
  avg_response_minutes,
  availability_summary,
  subscription_tier,
  subscription_until,
  service_categories ( name, name_he, slug )
`

/** Midrag columns — missing until 20260812000000_midrag_integration is applied. */
const PRO_SELECT_WITH_MIDRAG = `
  ${PRO_SELECT_CORE.trim()},
  midrag_profile_url,
  midrag_rating,
  midrag_reviews_count,
  midrag_verified,
  midrag_last_synced_at
`

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false
  return /midrag_/i.test(message) && /does not exist|schema cache/i.test(message)
}

async function selectProfessionals(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  id?: string
) {
  const base = supabase.from('professionals').select(PRO_SELECT_WITH_MIDRAG)
  const withMidrag = id
    ? await base.eq('id', id).maybeSingle()
    : await base.order('rating', { ascending: false })

  if (!withMidrag.error) return withMidrag

  if (!isMissingColumnError(withMidrag.error.message)) {
    return withMidrag
  }

  // Production may lag behind Midrag migration — retry without those columns.
  console.warn(
    '[supabase] professionals Midrag columns missing; falling back to core select'
  )
  const core = supabase.from('professionals').select(PRO_SELECT_CORE)
  return id
    ? await core.eq('id', id).maybeSingle()
    : await core.order('rating', { ascending: false })
}

export async function supabaseListProfessionals(): Promise<Professional[] | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await selectProfessionals(supabase)

  if (error) {
    console.error('[supabase] list professionals', error.message)
    return null
  }

  return ((data as unknown[]) ?? []).map((row) =>
    mapProfessionalRow(row as Parameters<typeof mapProfessionalRow>[0])
  )
}

export async function supabaseGetProfessionalById(
  id: string
): Promise<Professional | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await selectProfessionals(supabase, id)

  if (error || !data) return null
  return mapProfessionalRow(data as Parameters<typeof mapProfessionalRow>[0])
}

export async function supabaseGetFeaturedProfessionals(): Promise<
  Professional[] | null
> {
  const list = await supabaseListProfessionals()
  if (!list) return null
  return list.filter((p) => p.isFeatured && p.isAvailable).slice(0, 6)
}
