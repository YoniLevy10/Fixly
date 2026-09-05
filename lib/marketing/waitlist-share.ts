import { SITE_URL } from '@/lib/site-config'

/** Share link after waitlist signup — amplifies paid Meta traffic. */
export function buildWaitlistShareUrl(audience: 'customer' | 'professional'): string {
  const url = new URL(SITE_URL)
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
