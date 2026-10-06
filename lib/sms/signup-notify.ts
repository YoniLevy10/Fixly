import type { SupabaseClient } from '@supabase/supabase-js'
import { sms019Configured, send019Campaign } from '@/lib/sms/019'
import { normalizePhone } from '@/lib/prospects/phone'

export type SignupAlert = { full_name: string; phone: string; audience: string; city?: string | null }

export function buildSignupAlert(row: SignupAlert) {
  return [
    'הרשמה חדשה ב־Fixly',
    `שם: ${row.full_name}`,
    `טלפון: ${row.phone}`,
    `סוג: ${row.audience === 'professional' ? 'איש מקצוע' : 'לקוח'}`,
    row.city ? `עיר: ${row.city}` : null,
  ].filter(Boolean).join('\n').slice(0, 1005)
}

export function signupNotifyPhone() {
  const normalized = normalizePhone(process.env.SMS_SIGNUP_NOTIFY_PHONE ?? '0552819086')
  return normalized && /^9725\d{8}$/.test(normalized) ? `0${normalized.slice(3)}` : null
}

export async function deliverSignupNotification(admin: SupabaseClient, id: string) {
  const to = signupNotifyPhone()
  if (!sms019Configured() || !to) return { status: 'not_configured' }
  const signup = await admin.from('pro_waitlist').select('full_name, phone, audience, city').eq('id', id).single()
  if (signup.error) throw signup.error
  // Only one callback/cron can claim this registration's alert.
  const claimed = await admin.from('signup_sms_notifications').update({ status: 'submitting' })
    .eq('waitlist_id', id).eq('status', 'pending').select('waitlist_id').maybeSingle()
  if (claimed.error) throw claimed.error
  if (!claimed.data) return { status: 'already_claimed' }
  const outcome = await send019Campaign(id, buildSignupAlert(signup.data), [to], false)
  const saved = await admin.from('signup_sms_notifications').update({
    status: outcome.status, shipment_id: outcome.shipmentId, completed_at: new Date().toISOString(),
  }).eq('waitlist_id', id)
  if (saved.error) throw saved.error
  return outcome
}
