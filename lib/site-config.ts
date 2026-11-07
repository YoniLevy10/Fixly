/** Canonical public marketing URL — fixly.tech (SEO, waitlist, legal). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://fixly.tech'
).replace(/\/$/, '')

export const SITE_NAME = 'Fixly'
export const SITE_DOMAIN = 'fixly.tech'

type EnvLike = {
  NEXT_PUBLIC_PRODUCT_URL?: string
  NEXT_PUBLIC_PRODUCT_HOST?: string
  NODE_ENV?: string
}

/**
 * Resolve the product / marketplace origin.
 * Never falls back to a hard-coded vercel.app alias (wrong host = different app).
 */
export function resolveProductUrl(env: EnvLike = process.env): string {
  const fromUrl = env.NEXT_PUBLIC_PRODUCT_URL?.trim()
  if (fromUrl) return fromUrl.replace(/\/$/, '')

  const fromHost = env.NEXT_PUBLIC_PRODUCT_HOST?.trim()
  if (fromHost) {
    const host = fromHost.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    return `https://${host}`
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_PRODUCT_URL or NEXT_PUBLIC_PRODUCT_HOST must be set in production',
    )
  }

  return 'http://localhost:3000'
}

/**
 * Full product / marketplace URL.
 * Marketing domain (SITE_URL) stays registration-only; deep product links
 * and “כניסה למערכת” point here.
 */
export const PRODUCT_URL = resolveProductUrl()

/** Marketplace homepage — matches live `/` on the product host. */
export const DEFAULT_DESCRIPTION_HE =
  'Fixly מחברת לקוחות ובעלי מקצוע בישראל — בקשה אחת, התאמה לפי תחום ואזור, ומעקב עד שהעבודה נסגרת.'

export const DEFAULT_TITLE_HE = 'Fixly — תיקונים ואנשי מקצוע בישראל'

/** Professional waitlist / registration landing metadata. */
export const WAITLIST_DESCRIPTION_HE =
  'הצטרפו לרשימת ההשקה של Fixly לבעלי מקצוע בישראל. הרשמה ללא עלות לפי תחום ואזור, עם עדכון כשהשירות ייפתח באזור שלכם.'

export const WAITLIST_TITLE_HE = 'Fixly Pro — הרשמה לבעלי מקצוע לרשימת ההשקה'

export const ABOUT_TITLE_HE = 'אודות Fixly — פלטפורמה לבעלי מקצוע ותיקונים בישראל'

export const ABOUT_DESCRIPTION_HE =
  'Fixly מחברת לקוחות ובעלי מקצוע מאומתים בישראל: בקשה אחת, התאמה לפי תחום ואזור, ומעקב עד שהעבודה נסגרת. הצטרפו לרשימת ההמתנה.'

export const SEO_KEYWORDS_HE = [
  'Fixly',
  'תיקונים',
  'בעלי מקצוע',
  'אינסטלטור',
  'חשמלאי',
  'הנדימן',
  'שיפוצים',
  'התאמת בעלי מקצוע',
  'בעל מקצוע עד הבית',
  'הזמנת בעל מקצוע',
  'עבודות לבעלי מקצוע',
  'לידים לבעלי מקצוע',
  'ישראל',
  'תל אביב',
  'ירושלים',
  'חיפה',
] as const
