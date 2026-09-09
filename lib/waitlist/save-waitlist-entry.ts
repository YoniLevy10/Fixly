import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isSupabaseEnabled } from '@/lib/data/config'
import {
  addProWaitlistEntry,
  type WaitlistAudience,
  type WaitlistAttribution,
} from '@/lib/data/pro-waitlist-store'
import { trackError } from '@/lib/monitoring/track-error'
import { tryLinkProspectAfterWaitlist } from '@/lib/prospects/waitlist-bridge'

export type WaitlistSaveInput = {
  fullName: string
  phone: string
  email?: string
  category?: string
  city?: string
  referralCode?: string
  audience: WaitlistAudience
  source?: string
  attribution?: WaitlistAttribution | Record<string, string> | null
}

export type WaitlistSaveResult =
  | { ok: true; id: string; storage: 'supabase' | 'memory' }
  | { ok: false; error: string }

/**
 * Persist waitlist so Operations Center (/admin) can see signups.
 *
 * Bug fixed: `pro_waitlist` RLS allows INSERT but blocks SELECT for anon.
 * `.insert().select()` on the cookie/anon client fails RETURNING, and the
 * old routes silently wrote to process memory — UI showed success, admin
 * (which reads Supabase only) stayed empty.
 */
export async function saveWaitlistEntry(
  input: WaitlistSaveInput,
  route: string
): Promise<WaitlistSaveResult> {
  const baseRow = {
    full_name: input.fullName,
    phone: input.phone,
    email: input.email || null,
    category: input.category ?? null,
    city: input.city ?? null,
    referral_code: input.referralCode ?? null,
    audience: input.audience,
    source: input.source ?? null,
  }

  if (isSupabaseEnabled()) {
    const admin = getAdminSupabaseClient()
    if (!admin) {
      trackError(new Error('SUPABASE_SERVICE_ROLE_KEY missing for waitlist'), {
        route,
      })
      return {
        ok: false,
        error: 'שמירה נכשלה — הגדרות מסד נתונים חסרות',
      }
    }

    const attempts = [
      {
        ...baseRow,
        ...(input.attribution ? { attribution: input.attribution } : {}),
      },
      baseRow,
      {
        full_name: input.fullName,
        phone: input.phone,
        email: input.email || null,
        category: input.category ?? null,
        city: input.city ?? null,
        referral_code: input.referralCode ?? null,
      },
    ]

    let lastError: unknown = null
    for (const row of attempts) {
      const { data, error } = await admin
        .from('pro_waitlist')
        .insert(row)
        .select('id')
        .maybeSingle()

      if (!error) {
        const id = data?.id ?? crypto.randomUUID()
        await tryLinkProspectAfterWaitlist({
          phone: input.phone,
          audience: input.audience,
          waitlistId: data?.id ?? null,
        })
        return { ok: true, id, storage: 'supabase' }
      }
      lastError = error
    }

    trackError(lastError, { route })
    return { ok: false, error: 'שגיאה בשמירת הרשמה — נסו שוב' }
  }

  const entry = addProWaitlistEntry({
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    category: input.category,
    city: input.city,
    referralCode: input.referralCode,
    audience: input.audience,
    source: input.source,
    attribution: (input.attribution as WaitlistAttribution | undefined) ?? undefined,
  })
  return { ok: true, id: entry.id, storage: 'memory' }
}
