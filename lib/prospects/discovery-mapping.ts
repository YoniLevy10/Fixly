import {
  CORE_RECRUIT_CATEGORY_SLUGS,
  getRecruitCity,
} from '@/lib/prospects/config'

export type DiscoveryCategoryMapping = {
  slug: (typeof CORE_RECRUIT_CATEGORY_SLUGS)[number] | string
  /** Primary Hebrew Places text search — Midrag-style private mobile pro */
  placesQueryHe: string
  /** Extra Hebrew Places queries (same category, different intent) */
  placesQueriesHeExtra?: string[]
  /** Extra English Places query terms */
  placesQueryEn: string
  /** Overpass tag filters (OR within category) */
  osmFilters: string[]
}

/** All Places queries for a mapping (Hebrew primary + extras + English). */
export function placesQueriesFor(mapping: DiscoveryCategoryMapping): string[] {
  const he = [mapping.placesQueryHe, ...(mapping.placesQueriesHeExtra ?? [])]
  const en = mapping.placesQueryEn?.trim()
  return en ? [...he, en] : he
}

export type DiscoverySearchArea = {
  /** Hebrew area / neighborhood label appended to text queries */
  labelHe: string
  lat: number
  lng: number
  /** Location bias radius in meters */
  radiusMeters: number
}

/**
 * Jerusalem coverage grid — city-wide + neighborhoods so Places doesn't
 * collapse to the same ~20 results around the Old City / center.
 */
export const JERUSALEM_SEARCH_AREAS: DiscoverySearchArea[] = [
  {
    labelHe: 'ירושלים',
    lat: 31.7683,
    lng: 35.2137,
    radiusMeters: 14000,
  },
  {
    labelHe: 'פסגת זאב',
    lat: 31.8255,
    lng: 35.2385,
    radiusMeters: 4500,
  },
  {
    labelHe: 'רמות',
    lat: 31.812,
    lng: 35.194,
    radiusMeters: 4500,
  },
  {
    labelHe: 'גילה',
    lat: 31.7315,
    lng: 35.1885,
    radiusMeters: 4000,
  },
  {
    labelHe: 'תלפיות',
    lat: 31.75,
    lng: 35.22,
    radiusMeters: 4000,
  },
  {
    labelHe: 'בית הכרם',
    lat: 31.78,
    lng: 35.19,
    radiusMeters: 4000,
  },
  {
    labelHe: 'קטמון',
    lat: 31.76,
    lng: 35.205,
    radiusMeters: 4000,
  },
  {
    labelHe: 'מלחה',
    lat: 31.751,
    lng: 35.188,
    radiusMeters: 4000,
  },
  {
    labelHe: 'ארמון הנציב',
    lat: 31.754,
    lng: 35.236,
    radiusMeters: 4000,
  },
  {
    labelHe: 'נווה יעקב',
    lat: 31.84,
    lng: 35.24,
    radiusMeters: 4000,
  },
]

export type PlacesSearchJob = {
  textQuery: string
  area: DiscoverySearchArea
}

/**
 * Build Places text-search jobs with Jerusalem neighborhood coverage.
 * City-wide area gets every Hebrew + English query.
 * Neighborhoods get the primary Hebrew query only (avoids exploding API cost).
 */
export function placesSearchJobsFor(
  mapping: DiscoveryCategoryMapping,
  city: string,
  areas: DiscoverySearchArea[] = JERUSALEM_SEARCH_AREAS,
): PlacesSearchJob[] {
  const allQueries = placesQueriesFor(mapping)
  const primaryOnly = [mapping.placesQueryHe]
  const jobs: PlacesSearchJob[] = []

  for (const area of areas) {
    const isCityWide =
      area.labelHe === city || area.labelHe === 'ירושלים'
    const queries = isCityWide ? allQueries : primaryOnly
    const placeLabel = isCityWide ? city : area.labelHe
    for (const queryBase of queries) {
      jobs.push({
        textQuery: `${queryBase} ${placeLabel}`,
        area,
      })
    }
  }
  return jobs
}

/**
 * Legal discovery mappings aimed at Midrag-style private tradespeople:
 * person name + craft + mobile — not shops, chains, or call centers.
 */
export const DISCOVERY_CATEGORY_MAP: DiscoveryCategoryMapping[] = [
  {
    slug: 'plumbing',
    placesQueryHe: 'אינסטלטור מומלץ נייד',
    placesQueriesHeExtra: ['אינסטלטור עד הבית', 'אינסטלטור עצמאי'],
    placesQueryEn: 'recommended mobile plumber',
    osmFilters: ['craft=plumber'],
  },
  {
    slug: 'electricity',
    placesQueryHe: 'חשמלאי מומלץ נייד',
    placesQueriesHeExtra: ['חשמלאי מוסמך עד הבית', 'חשמלאי עצמאי'],
    placesQueryEn: 'recommended mobile electrician',
    osmFilters: ['craft=electrician'],
  },
  {
    slug: 'ac',
    placesQueryHe: 'טכנאי מזגנים מומלץ נייד',
    placesQueriesHeExtra: ['מתקין מזגנים עצמאי', 'טכנאי מזגנים עד הבית'],
    placesQueryEn: 'recommended mobile AC technician',
    osmFilters: ['craft=hvac'],
  },
  {
    slug: 'cleaning',
    placesQueryHe: 'מנקה דירות פרטי מומלץ',
    placesQueriesHeExtra: ['ניקיון דירות עצמאי נייד'],
    placesQueryEn: 'recommended private house cleaner',
    osmFilters: ['craft=cleaner'],
  },
  {
    slug: 'painting',
    placesQueryHe: 'צבעי דירות מומלץ נייד',
    placesQueriesHeExtra: ['צבעי עצמאי עד הבית'],
    placesQueryEn: 'recommended mobile house painter',
    osmFilters: ['craft=painter'],
  },
  {
    slug: 'carpentry',
    placesQueryHe: 'נגר מומלץ נייד',
    placesQueriesHeExtra: ['נגר רהיטים עצמאי'],
    placesQueryEn: 'recommended mobile carpenter',
    osmFilters: ['craft=carpenter'],
  },
  {
    slug: 'locksmith',
    placesQueryHe: 'מנעולן מומלץ נייד',
    placesQueriesHeExtra: ['מנעולן 24 שעות עצמאי'],
    placesQueryEn: 'recommended mobile locksmith',
    osmFilters: ['craft=locksmith'],
  },
  {
    slug: 'gardening',
    placesQueryHe: 'גנן מומלץ פרטי',
    placesQueriesHeExtra: ['גנן עצמאי נייד', 'גיזום עצים עצמאי'],
    placesQueryEn: 'recommended private gardener',
    osmFilters: ['craft=gardener'],
  },
  {
    slug: 'moving',
    placesQueryHe: 'מוביל דירות עצמאי נייד',
    placesQueriesHeExtra: ['הובלות קטנות עצמאי'],
    placesQueryEn: 'independent small moving',
    osmFilters: ['office=moving_company'],
  },
  {
    slug: 'tiling',
    placesQueryHe: 'רצף מומלץ נייד',
    placesQueriesHeExtra: [
      'מתקין קרמיקה עצמאי',
      'רצף דירות מומלץ',
      'מתקין פרקטים עצמאי',
    ],
    placesQueryEn: 'recommended mobile tile installer',
    osmFilters: ['craft=tiler'],
  },
  {
    slug: 'renovations',
    placesQueryHe: 'קבלן שיפוצים עצמאי מומלץ',
    placesQueriesHeExtra: ['שיפוצניק פרטי נייד'],
    placesQueryEn: 'recommended independent renovator',
    osmFilters: ['craft=builder'],
  },
  {
    slug: 'waterproofing',
    placesQueryHe: 'איטום גגות עצמאי מומלץ',
    placesQueriesHeExtra: ['איטום רטיבות פרטי נייד'],
    placesQueryEn: 'recommended private waterproofing',
    osmFilters: ['craft=roofer'],
  },
  {
    slug: 'aluminum',
    placesQueryHe: 'אלומיניום מתקין עצמאי',
    placesQueriesHeExtra: ['תריסים אלומיניום פרטי נייד'],
    placesQueryEn: 'independent aluminum installer',
    osmFilters: ['craft=window_construction'],
  },
  {
    slug: 'drywall',
    placesQueryHe: 'גבס מתקין עצמאי מומלץ',
    placesQueriesHeExtra: ['טייח גבס פרטי נייד'],
    placesQueryEn: 'recommended private drywall installer',
    osmFilters: ['craft=plasterer'],
  },
  {
    slug: 'solar',
    placesQueryHe: 'דודי שמש טכנאי עצמאי',
    placesQueriesHeExtra: ['מתקין דודי שמש מומלץ נייד'],
    placesQueryEn: 'independent solar water heater technician',
    osmFilters: ['craft=plumber'],
  },
  {
    slug: 'appliance_repair',
    placesQueryHe: 'טכנאי מכשירי חשמל מומלץ נייד',
    placesQueriesHeExtra: ['תיקון מכונת כביסה עצמאי'],
    placesQueryEn: 'recommended mobile appliance technician',
    osmFilters: ['craft=electronics_repair'],
  },
  {
    slug: 'pest_control',
    placesQueryHe: 'מדביר מומלץ פרטי',
    placesQueriesHeExtra: ['הדברה דירות עצמאי נייד'],
    placesQueryEn: 'recommended private pest control',
    osmFilters: [],
  },
  {
    slug: 'glazing',
    placesQueryHe: 'זגג מומלץ נייד',
    placesQueriesHeExtra: ['זגג עצמאי עד הבית'],
    placesQueryEn: 'recommended mobile glazier',
    osmFilters: ['craft=glaziery'],
  },
  {
    slug: 'furniture',
    placesQueryHe: 'הרכבת רהיטים עצמאי נייד',
    placesQueriesHeExtra: ['תיקון רהיטים מומלץ פרטי'],
    placesQueryEn: 'independent furniture assembly',
    osmFilters: ['craft=cabinet_maker'],
  },
]

export const ALLOWED_DISCOVERY_SOURCES = [
  'google_places',
  'osm',
  'manual',
  'csv',
] as const

export type AllowedDiscoverySource = (typeof ALLOWED_DISCOVERY_SOURCES)[number]

export function isAllowedDiscoverySource(name: string): boolean {
  return (ALLOWED_DISCOVERY_SOURCES as readonly string[]).includes(name)
}

/** Approximate Jerusalem bbox for Overpass (south,west,north,east). */
export const JERUSALEM_BBOX = {
  south: 31.72,
  west: 35.14,
  north: 31.87,
  east: 35.28,
} as const

/** Jerusalem center for Places location bias. */
export const JERUSALEM_CENTER = {
  lat: 31.7683,
  lng: 35.2137,
  radiusMeters: 12000,
} as const

export function getDiscoveryCity(): string {
  return getRecruitCity()
}

export function getDiscoveryMappingsForSlugs(
  slugs: string[],
): DiscoveryCategoryMapping[] {
  const set = new Set(slugs)
  return DISCOVERY_CATEGORY_MAP.filter((m) => set.has(m.slug))
}
