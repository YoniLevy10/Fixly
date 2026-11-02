/** Canonical public marketing URL — fixly.tech (SEO, waitlist, legal). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://fixly.tech'
).replace(/\/$/, '')

export const SITE_NAME = 'Fixly'
export const SITE_DOMAIN = 'fixly.tech'

/**
 * Full product / marketplace URL (Vercel production alias by default).
 * Marketing domain (SITE_URL) stays registration-only; deep product links
 * and “כניסה למערכת” point here. Override with NEXT_PUBLIC_PRODUCT_URL.
 */
export const PRODUCT_URL = (
  process.env.NEXT_PUBLIC_PRODUCT_URL?.trim() || 'https://fixly.vercel.app'
).replace(/\/$/, '')

/** Marketplace homepage — matches live `/` on the product host. */
export const DEFAULT_DESCRIPTION_HE =
  'Fixly מחברת לקוחות ובעלי מקצוע בישראל — בקשה אחת, התאמה לפי תחום ואזור, ומעקב עד שהעבודה נסגרת.'

export const DEFAULT_TITLE_HE = 'Fixly — תיקונים ואנשי מקצוע בישראל'

/** Professional waitlist / registration landing metadata. */
export const WAITLIST_DESCRIPTION_HE =
  'הצטרפו לרשימת ההשקה של Fixly לבעלי מקצוע בישראל. הרשמה ללא עלות לפי תחום ואזור, עם עדכון כשהשירות ייפתח באזור שלכם.'

export const WAITLIST_TITLE_HE = 'Fixly Pro — הצטרפות בעלי מקצוע לרשימת ההשקה'

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
