/** Canonical public site URL — default Fixly.tech for SEO / GSC */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://fixly.tech'
).replace(/\/$/, '')

export const SITE_NAME = 'Fixly'
export const SITE_DOMAIN = 'fixly.tech'

export const DEFAULT_DESCRIPTION_HE =
  'Fixly — פלטפורמת תיקונים ואנשי מקצוע בישראל. הירשמו מראש לפתיחה וקבלו גישה מוקדמת — ללקוחות ולבעלי מקצוע.'

export const DEFAULT_TITLE_HE = 'Fixly — תיקונים ואנשי מקצוע | הרשמה מוקדמת'
