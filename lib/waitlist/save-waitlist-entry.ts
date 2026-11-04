import { after } from 'next/server'
import { deliverSignupNotification, signupNotificationsEnabled } from '@/lib/sms/signup-notify'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isSupabaseEnabled } from '@/lib/data/config'
import type {
  WaitlistAudience,
  WaitlistAttribution,
} from '@/lib/data/pro-waitlist-store'
import { phonesMatch } from '@/lib/prospects/phone'
import { waitlistPhoneLookupFilter } from '@/lib/waitlist/phone-lookup'
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
  | { ok: true; id: string; storage: 'supabase'; alreadyRegistered: boolean }
  | { ok: false; error: string; status: 400 | 503 }

type WaitlistAdmin = NonNullable<ReturnType<typeof getAdminSupabaseClient>>

/**
 * A repeated submit of the same mobile should return the existing row.
 * Phone formats differ (`050…`, `+972…`), so match on the normalized number.
 */
export async function findExistingProfessionalWaitlistId(
  admin: WaitlistAdmin,
  phone: string,
): Promise<string | null> {
  const filter = waitlistPhoneLookupFilter(phone)
  if (!filter) return null
  const { data, error } = await admin
    .from('pro_waitlist')
    .select('id, phone')
    .eq('audience', 'professional')
    .or(filter)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    trackError(error, { route: 'waitlist-duplicate-lookup' })
    return null
  }

  const match = (data ?? []).find((row) => phonesMatch(row.phone, phone))
  return match?.id ?? null
}

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
    return { ok: false, error: spam, status: 400 }
  }

  if (!input.audience || (input.audience !== 'customer' && input.audience !== 'professional')) {
    return { ok: false, error: 'יש לבחור סוג הרשמה', status: 400 }
  }

  if (!isSupabaseEnabled()) {
    trackError(new Error('waitlist save refused: supabase disabled'), { route })
    return {
      ok: false,
      status: 503,
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
      status: 503,
      error: 'שמירה נכשלה — הגדרות מסד נתונים חסרות',
    }
  }

  if (input.audience === 'professional') {
    const existingId = await findExistingProfessionalWaitlistId(admin, input.phone)
    if (existingId) {
      return { ok: true, id: existingId, storage: 'supabase', alreadyRegistered: true }
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
    return { ok: false, status: 503, error: 'שגיאה בשמירת הרשמה — נסו שוב' }
  }

  if (!data?.id) {
    trackError(new Error('waitlist insert returned no id'), { route })
    return { ok: false, status: 503, error: 'שגיאה בשמירת הרשמה — נסו שוב' }
  }

  // The database queues the notification atomically. Send after responding;
  // the cron can pick up pending work if this callback does not run.
  if (signupNotificationsEnabled()) after(async () => {
    try { await deliverSignupNotification(admin, data.id) }
    catch (error) { trackError(error, { route: 'signup-sms-notification' }) }
  })
  return { ok: true, id: data.id, storage: 'supabase', alreadyRegistered: false }
}
