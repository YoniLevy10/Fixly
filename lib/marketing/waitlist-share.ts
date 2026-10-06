import { SITE_URL } from '@/lib/site-config'

/** Canonical public registration (customers + professionals). */
export const WAITLIST_LANDING_PATH = '/waitlist'

/** @deprecated Prefer WAITLIST_LANDING_PATH?audience=professional — kept for redirects. */
export const PRO_JOIN_PATH = '/pro/join'

/**
 * Share link after waitlist signup.
 * Channel classification: utm_medium=share (not whatsapp) so GA does not
 * mis-bucket organic/share traffic as Social from a WhatsApp UA alone.
 */
export function buildWaitlistShareUrl(audience: 'customer' | 'professional'): string {
  const url = new URL(
    WAITLIST_LANDING_PATH,
    SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`,
  )
  if (audience === 'professional') {
    url.searchParams.set('audience', 'professional')
  }
  url.searchParams.set('utm_source', 'share')
  url.searchParams.set('utm_medium', 'share')
  url.searchParams.set('utm_campaign', 'waitlist_referral')
  url.searchParams.set('utm_content', audience)
  url.searchParams.set('ref', 'waitlist_share')
  return url.toString()
}

export function buildWaitlistShareMessage(audience: 'customer' | 'professional'): string {
  const link = buildWaitlistShareUrl(audience)
  if (audience === 'professional') {
    return `נרשמתי ל-Fixly — עבודות אמיתיות, קרובות הביתה. שווה להצטרף:\n${link}`
  }
  return `יש תקלה בבית? Fixly מחברת לבעל מקצוע — בלי עשרות טלפונים. נרשמתי בחינם:\n${link}`
}

/** WhatsApp share sheet (no phone) — opens contact picker. */
export function buildWaitlistWhatsAppShareUrl(audience: 'customer' | 'professional'): string {
  const text = encodeURIComponent(buildWaitlistShareMessage(audience))
  return `https://wa.me/?text=${text}`
}
