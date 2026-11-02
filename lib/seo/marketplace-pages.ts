/**
 * National SEO inventory (Israel).
 * Routes are generated for the full matrix; indexing is gated by real value
 * (see `lib/seo/has-seo-value.ts`). Prefer hubs + indexable city×category only in sitemap.
 *
 * Jerusalem stays first for the primary organic intent cluster.
 */

export type SeoCity = {
  slug: string
  nameHe: string
  nameEn: string
  /** Hebrew substrings used to match professional.location / waitlist.city */
  query: string
}

export type SeoCategory = {
  slug: string
  nameHe: string
  nameEn: string
  /** Plural / jobs phrasing for pro-recruitment copy */
  jobsHe: string
}

/** Primary organic cluster — must remain first in SEO_CITIES. */
export const PRIMARY_SEO_CITY_SLUG = 'jerusalem' as const

/** Major demand centers — national coverage, Jerusalem first. */
export const SEO_CITIES: readonly SeoCity[] = [
  { slug: 'jerusalem', nameHe: 'ירושלים', nameEn: 'Jerusalem', query: 'ירושלים' },
  { slug: 'tel-aviv', nameHe: 'תל אביב', nameEn: 'Tel Aviv', query: 'תל אביב' },
  { slug: 'haifa', nameHe: 'חיפה', nameEn: 'Haifa', query: 'חיפה' },
  { slug: 'rishon-lezion', nameHe: 'ראשון לציון', nameEn: 'Rishon LeZion', query: 'ראשון לציון' },
  { slug: 'petah-tikva', nameHe: 'פתח תקווה', nameEn: 'Petah Tikva', query: 'פתח תקווה' },
  { slug: 'ashdod', nameHe: 'אשדוד', nameEn: 'Ashdod', query: 'אשדוד' },
  { slug: 'netanya', nameHe: 'נתניה', nameEn: 'Netanya', query: 'נתניה' },
  { slug: 'beer-sheva', nameHe: 'באר שבע', nameEn: 'Beer Sheva', query: 'באר שבע' },
  { slug: 'holon', nameHe: 'חולון', nameEn: 'Holon', query: 'חולון' },
  { slug: 'bnei-brak', nameHe: 'בני ברק', nameEn: 'Bnei Brak', query: 'בני ברק' },
  { slug: 'ramat-gan', nameHe: 'רמת גן', nameEn: 'Ramat Gan', query: 'רמת גן' },
  { slug: 'rehovot', nameHe: 'רחובות', nameEn: 'Rehovot', query: 'רחובות' },
  { slug: 'herzliya', nameHe: 'הרצליה', nameEn: 'Herzliya', query: 'הרצליה' },
  { slug: 'kfar-saba', nameHe: 'כפר סבא', nameEn: 'Kfar Saba', query: 'כפר סבא' },
  { slug: 'modiin', nameHe: 'מודיעין', nameEn: 'Modiin', query: 'מודיעין' },
  { slug: 'ashkelon', nameHe: 'אשקלון', nameEn: 'Ashkelon', query: 'אשקלון' },
  { slug: 'bat-yam', nameHe: 'בת ים', nameEn: 'Bat Yam', query: 'בת ים' },
  { slug: 'hadera', nameHe: 'חדרה', nameEn: 'Hadera', query: 'חדרה' },
  { slug: 'nahariya', nameHe: 'נהריה', nameEn: 'Nahariya', query: 'נהריה' },
  { slug: 'eilat', nameHe: 'אילת', nameEn: 'Eilat', query: 'אילת' },
] as const

/** Trades with clear Hebrew search intent — aligned with product catalog slugs. */
export const SEO_CATEGORIES: readonly SeoCategory[] = [
  { slug: 'plumbing', nameHe: 'אינסטלטור', nameEn: 'Plumber', jobsHe: 'עבודות לאינסטלטורים' },
  { slug: 'electricity', nameHe: 'חשמלאי', nameEn: 'Electrician', jobsHe: 'עבודות לחשמלאים' },
  { slug: 'ac', nameHe: 'טכנאי מיזוג אוויר', nameEn: 'AC Technician', jobsHe: 'עבודות לטכנאי מיזוג' },
  { slug: 'handyman', nameHe: 'הנדימן', nameEn: 'Handyman', jobsHe: 'עבודות להנדימנים' },
  { slug: 'cleaning', nameHe: 'ניקיון', nameEn: 'Cleaning', jobsHe: 'עבודות ניקיון' },
  { slug: 'painting', nameHe: 'צבעי', nameEn: 'Painter', jobsHe: 'עבודות לצבועים' },
  { slug: 'carpentry', nameHe: 'נגר', nameEn: 'Carpenter', jobsHe: 'עבודות לנגרים' },
  { slug: 'locksmith', nameHe: 'מנעולן', nameEn: 'Locksmith', jobsHe: 'עבודות למנעולנים' },
  { slug: 'gardening', nameHe: 'גינון', nameEn: 'Gardening', jobsHe: 'עבודות גינון' },
  { slug: 'renovations', nameHe: 'שיפוצניק', nameEn: 'Renovations', jobsHe: 'עבודות שיפוצים' },
  { slug: 'moving', nameHe: 'הובלות', nameEn: 'Moving', jobsHe: 'עבודות הובלה' },
  { slug: 'pest_control', nameHe: 'מדביר', nameEn: 'Pest control', jobsHe: 'עבודות הדברה' },
  { slug: 'waterproofing', nameHe: 'איטום', nameEn: 'Waterproofing', jobsHe: 'עבודות איטום' },
  { slug: 'appliance_repair', nameHe: 'טכנאי מכשירים', nameEn: 'Appliance repair', jobsHe: 'עבודות תיקון מכשירים' },
] as const

export function getCityBySlug(slug: string): SeoCity | undefined {
  return SEO_CITIES.find((c) => c.slug === slug)
}

export function getCategoryBySlug(slug: string): SeoCategory | undefined {
  return SEO_CATEGORIES.find((c) => c.slug === slug)
}

/** Canonical programmatic SEO URL: profession × city */
export function seoPagePath(categorySlug: string, citySlug: string): string {
  return `/professionals/${categorySlug}/${citySlug}`
}

/** Legacy URL kept for redirects / old GSC entries */
export function legacyServicesPath(citySlug: string, categorySlug: string): string {
  return `/services/${citySlug}/${categorySlug}`
}

export function categoryHubPath(categorySlug: string): string {
  return `/professionals/${categorySlug}`
}

export function locationHubPath(citySlug: string): string {
  return `/locations/${citySlug}`
}

export function allSeoPairs(): { city: SeoCity; category: SeoCategory }[] {
  return SEO_CITIES.flatMap((city) =>
    SEO_CATEGORIES.map((category) => ({ city, category })),
  )
}

export const SEO_PAIR_COUNT = SEO_CITIES.length * SEO_CATEGORIES.length
