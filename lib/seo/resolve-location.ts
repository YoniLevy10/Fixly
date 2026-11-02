import {
  PRIMARY_SEO_CITY_SLUG,
  SEO_CATEGORIES,
  SEO_CITIES,
  getCategoryBySlug,
  getCityBySlug,
} from '@/lib/seo/marketplace-pages'

/** Default SEO city when location is missing/unknown — Jerusalem intent cluster. */
const DEFAULT_CITY_SLUG = PRIMARY_SEO_CITY_SLUG

/** Synthetic guest / unset product defaults — treat as unknown for SEO links. */
const UNKNOWN_LOCATION_MARKERS = [
  'תל אביב-יפו',
  'tel aviv-yafo',
  'tel-aviv-yafo',
]

/**
 * Map a free-text Israeli location (e.g. user.location / pro.location)
 * onto an SEO city slug. Falls back to Jerusalem.
 */
export function resolveSeoCitySlug(location?: string | null): string {
  const text = (location ?? '').trim()
  if (!text) return DEFAULT_CITY_SLUG

  const lower = text.toLowerCase()
  for (const city of SEO_CITIES) {
    if (
      text.includes(city.query) ||
      lower.includes(city.nameEn.toLowerCase()) ||
      lower.includes(city.slug.replace(/-/g, ' '))
    ) {
      return city.slug
    }
  }

  // Common aliases not covered by query/nameEn
  if (text.includes('יפו') || lower.includes('yafo') || lower.includes('jaffa')) {
    return 'tel-aviv'
  }
  if (text.includes('באר שבע') || lower.includes('beersheba') || lower.includes('beer sheva')) {
    return 'beer-sheva'
  }
  if (text.includes('ראשון') || lower.includes('rishon')) {
    return 'rishon-lezion'
  }
  if (text.includes('פתח') || lower.includes('petah') || lower.includes('petach')) {
    return 'petah-tikva'
  }

  return DEFAULT_CITY_SLUG
}

/**
 * City slug for internal SEO links (home tiles, related services).
 * Keeps a real detected city; maps empty / anonymous guest defaults → Jerusalem.
 */
export function resolveInternalLinkCitySlug(
  location?: string | null,
  options?: { isAnonymous?: boolean },
): string {
  const text = (location ?? '').trim()
  if (!text) return DEFAULT_CITY_SLUG

  if (options?.isAnonymous) {
    const lower = text.toLowerCase()
    if (UNKNOWN_LOCATION_MARKERS.some((m) => lower === m || text === m)) {
      return DEFAULT_CITY_SLUG
    }
  }

  return resolveSeoCitySlug(text)
}

const CATEGORY_NEEDLES: { slug: (typeof SEO_CATEGORIES)[number]['slug']; needles: string[] }[] = [
  { slug: 'plumbing', needles: ['אינסטל', 'שרברב', 'plumb'] },
  { slug: 'electricity', needles: ['חשמל', 'electric'] },
  { slug: 'ac', needles: ['מיזוג', 'מזגן', 'air conditioning', ' a/c', 'ac '] },
  { slug: 'cleaning', needles: ['ניקיון', 'מנקה', 'clean'] },
  { slug: 'painting', needles: ['צבע', 'צביע', 'paint'] },
  { slug: 'carpentry', needles: ['נגר', 'carpentry', 'carpenter'] },
  { slug: 'locksmith', needles: ['מנעול', 'locksmith'] },
  { slug: 'gardening', needles: ['גינון', 'גנן', 'garden'] },
]

/**
 * Map a professional category/title onto an SEO category slug when possible.
 * Returns null when the category is outside the 8 SEO landing categories.
 */
export function resolveSeoCategorySlug(
  ...labels: Array<string | null | undefined>
): string | null {
  const hay = labels.filter(Boolean).join(' ').toLowerCase()
  if (!hay) return null

  // Exact slug match first
  for (const cat of SEO_CATEGORIES) {
    if (hay === cat.slug || hay.includes(cat.slug)) {
      return cat.slug
    }
  }

  for (const entry of CATEGORY_NEEDLES) {
    if (entry.needles.some((n) => hay.includes(n.toLowerCase()))) {
      return entry.slug
    }
  }

  return null
}

export function resolveSeoCityAndCategory(pro: {
  location?: string
  category?: string
  title?: string
  categories?: string[]
}) {
  const citySlug = resolveSeoCitySlug(pro.location)
  const categorySlug = resolveSeoCategorySlug(
    pro.category,
    pro.title,
    ...(pro.categories ?? []),
  )
  const city = getCityBySlug(citySlug)
  const category = categorySlug ? getCategoryBySlug(categorySlug) : undefined
  return { citySlug, categorySlug, city, category }
}

export { DEFAULT_CITY_SLUG }
