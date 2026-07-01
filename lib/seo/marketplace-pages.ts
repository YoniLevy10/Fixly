/** Canonical city slugs for SEO landing pages */
export const SEO_CITIES = [
  { slug: 'tel-aviv', nameHe: 'תל אביב', nameEn: 'Tel Aviv', query: 'תל אביב' },
  { slug: 'haifa', nameHe: 'חיפה', nameEn: 'Haifa', query: 'חיפה' },
  { slug: 'jerusalem', nameHe: 'ירושלים', nameEn: 'Jerusalem', query: 'ירושלים' },
  { slug: 'beer-sheva', nameHe: 'באר שבע', nameEn: 'Beer Sheva', query: 'באר שבע' },
  { slug: 'petah-tikva', nameHe: 'פתח תקווה', nameEn: 'Petah Tikva', query: 'פתח תקווה' },
  { slug: 'rishon-lezion', nameHe: 'ראשון לציון', nameEn: 'Rishon LeZion', query: 'ראשון לציון' },
] as const

export const SEO_CATEGORIES = [
  { slug: 'plumbing', nameHe: 'אינסטלטור', nameEn: 'Plumber' },
  { slug: 'electricity', nameHe: 'חשמלאי', nameEn: 'Electrician' },
  { slug: 'ac', nameHe: 'מיזוג אוויר', nameEn: 'AC Technician' },
  { slug: 'cleaning', nameHe: 'ניקיון', nameEn: 'Cleaning' },
  { slug: 'painting', nameHe: 'צבעי', nameEn: 'Painter' },
  { slug: 'carpentry', nameHe: 'נגרות', nameEn: 'Carpenter' },
  { slug: 'locksmith', nameHe: 'מנעולן', nameEn: 'Locksmith' },
  { slug: 'gardening', nameHe: 'גינון', nameEn: 'Gardening' },
] as const

export function getCityBySlug(slug: string) {
  return SEO_CITIES.find((c) => c.slug === slug)
}

export function getCategoryBySlug(slug: string) {
  return SEO_CATEGORIES.find((c) => c.slug === slug)
}

export function seoPagePath(citySlug: string, categorySlug: string): string {
  return `/services/${citySlug}/${categorySlug}`
}
