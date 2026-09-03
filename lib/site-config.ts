/** Canonical public marketing URL — fixly.tech for SEO / GSC */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://fixly.tech'
).replace(/\/$/, '')

export const SITE_NAME = 'Fixly'
export const SITE_DOMAIN = 'fixly.tech'

/**
 * Optional public URL of the product app (usually *.vercel.app).
 * When unset, callers should use the current host or vercel production alias.
 */
export const PRODUCT_URL = (
  process.env.NEXT_PUBLIC_PRODUCT_URL?.trim() || ''
).replace(/\/$/, '') || null

export const DEFAULT_DESCRIPTION_HE =
  'Fixly — תיקונים ואנשי מקצוע בישראל. בקשה אחת, התאמה לבעל מקצוע מאומת, ומעקב עד סיום. הירשמו להרשמה מוקדמת בחינם — ללקוחות ולבעלי מקצוע.'

export const DEFAULT_TITLE_HE =
  'Fixly — בעל מקצוע מאומת עד הבית | הרשמה מוקדמת בישראל'

export const SEO_KEYWORDS_HE = [
  'Fixly',
  'תיקונים',
  'בעלי מקצוע',
  'אינסטלטור',
  'חשמלאי',
  'שיפוצים',
  'התאמת בעלי מקצוע',
  'בעל מקצוע עד הבית',
  'הזמנת בעל מקצוע',
  'ישראל',
  'הרשמה מוקדמת',
] as const
