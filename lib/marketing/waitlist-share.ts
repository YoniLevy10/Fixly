import { SITE_URL } from '@/lib/site-config'

/** Canonical demand-campaign landing (not `/` — that is the product demo). */
export const WAITLIST_LANDING_PATH = '/waitlist'

/** Canonical pro join from lead-engine / outreach. */
export const PRO_JOIN_PATH = '/pro/join'

/** Share link after waitlist signup — amplifies paid Meta traffic onto /waitlist. */
export function buildWaitlistShareUrl(audience: 'customer' | 'professional'): string {
  const path = audience === 'professional' ? PRO_JOIN_PATH : WAITLIST_LANDING_PATH
  const url = new URL(path, SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`)
  url.searchParams.set('utm_source', 'share')
  url.searchParams.set('utm_medium', 'whatsapp')
  url.searchParams.set('utm_campaign', 'weekend_waitlist')
  url.searchParams.set('utm_content', audience)
  url.searchParams.set('ref', 'waitlist_share')
  return url.toString()
}

export function buildWaitlistShareMessage(audience: 'customer' | 'professional'): string {
  const link = buildWaitlistShareUrl(audience)
  if (audience === 'professional') {
    return `נרשמתי לפיילוט של Fixly — פלטפורמה לבעלי מקצוע מאומתים בישראל. כדאי להירשם מוקדם:\n${link}`
  }
  return `יש תקלה בבית? Fixly מחברת לבעל מקצוע מאומת — בלי עשרות טלפונים. נרשמתי מראש בחינם:\n${link}`
}

/** WhatsApp share sheet (no phone) — opens contact picker. */
export function buildWaitlistWhatsAppShareUrl(audience: 'customer' | 'professional'): string {
  const text = encodeURIComponent(buildWaitlistShareMessage(audience))
  return `https://wa.me/?text=${text}`
}
