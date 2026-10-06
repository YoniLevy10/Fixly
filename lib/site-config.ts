/** Canonical public app URL — always fixly.tech in production */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://fixly.tech'
).replace(/\/$/, '')

export const SITE_NAME = 'Fixly'
export const SITE_DOMAIN = 'fixly.tech'

/**
 * Public product URL. Defaults to SITE_URL (fixly.tech).
 * Prefer not pointing users at *.vercel.app aliases.
 */
export const PRODUCT_URL = (
  process.env.NEXT_PUBLIC_PRODUCT_URL?.trim() || SITE_URL
).replace(/\/$/, '')

/** Marketplace homepage — matches live `/` (nationwide product, not waitlist). */
export const DEFAULT_DESCRIPTION_HE =
  'Fixly מחברת לקוחות ובעלי מקצוע בישראל — בקשה אחת, התאמה לפי תחום ואזור, ומעקב עד שהעבודה נסגרת.'

export const DEFAULT_TITLE_HE = 'Fixly — תיקונים ואנשי מקצוע בישראל'

/** Waitlist / registration landing copy (use on /waitlist only). */
export const WAITLIST_DESCRIPTION_HE =
  'הצטרפו ל-Fixly בחינם. עבודות אמיתיות לפי תחום ואזור — שם וטלפון, בלי כרטיס אשראי.'

export const WAITLIST_TITLE_HE = 'Fixly — עבודות לבעלי מקצוע | הרשמה מוקדמת'

export const ABOUT_TITLE_HE = 'אודות Fixly — פלטפורמה לבעלי מקצוע ותיקונים בישראל'

export const ABOUT_DESCRIPTION_HE =
  'Fixly מחברת לקוחות ובעלי מקצוע מאומתים בישראל: בקשה אחת, התאמה לפי תחום ואזור, ומעקב עד שהעבודה נסגרת. הצטרפו לרשימת ההמתנה.'

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
] as const
