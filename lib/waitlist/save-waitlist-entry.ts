import { after } from 'next/server'
import { deliverSignupNotification } from '@/lib/sms/signup-notify'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isSupabaseEnabled } from '@/lib/data/config'
import type {
  WaitlistAudience,
  WaitlistAttribution,
} from '@/lib/data/pro-waitlist-store'
import { trackError } from '@/lib/monitoring/track-error'
import { looksLikeSpamWaitlist } from '@/lib/waitlist/spam-guard'

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
  | { ok: true; id: string; storage: 'supabase' }
  | { ok: false; error: string }

/**
 * Persist a real public registration into `pro_waitlist`.
 *
 * Rules:
 * - Never report success without a returned Supabase row id
 * - Never fall back to process memory in production paths
 * - Never link / merge into professional_prospects (kept separate)
 */
export async function saveWaitlistEntry(
  input: WaitlistSaveInput,
  route: string
): Promise<WaitlistSaveResult> {
  const spam = looksLikeSpamWaitlist({
    fullName: input.fullName,
    phone: input.phone,
    city: input.city,
    category: input.category,
  })
  if (spam) {
    return { ok: false, error: spam }
  }

  if (!input.audience || (input.audience !== 'customer' && input.audience !== 'professional')) {
    return { ok: false, error: 'יש לבחור סוג הרשמה' }
  }

  if (!isSupabaseEnabled()) {
    trackError(new Error('waitlist save refused: supabase disabled'), { route })
    return {
      ok: false,
      error: 'שמירה נכשלה — מסד הנתונים לא מוגדר',
    }
  }

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

  const row = {
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    category: input.category?.trim() || null,
    city: input.city?.trim() || null,
    referral_code: input.referralCode?.trim() || null,
    audience: input.audience,
    source: input.source?.trim() || null,
    attribution: input.attribution && Object.keys(input.attribution).length
      ? input.attribution
      : null,
  }

  const { data, error } = await admin
    .from('pro_waitlist')
    .insert(row)
    .select('id')
    .maybeSingle()

  if (error) {
    trackError(error, { route })
    return { ok: false, error: 'שגיאה בשמירת הרשמה — נסו שוב' }
  }

  if (!data?.id) {
    trackError(new Error('waitlist insert returned no id'), { route })
    return { ok: false, error: 'שגיאה בשמירת הרשמה — נסו שוב' }
  }

  // The database queues the notification atomically. Send after responding;
  // the cron can pick up pending work if this callback does not run.
  after(async () => {
    try { await deliverSignupNotification(admin, data.id) }
    catch (error) { trackError(error, { route: 'signup-sms-notification' }) }
  })
  return { ok: true, id: data.id, storage: 'supabase' }
}
