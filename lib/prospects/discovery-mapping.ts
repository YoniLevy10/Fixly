import {
  CORE_RECRUIT_CATEGORY_SLUGS,
  getRecruitCity,
} from '@/lib/prospects/config'

export type DiscoveryCategoryMapping = {
  slug: (typeof CORE_RECRUIT_CATEGORY_SLUGS)[number] | string
  /** Primary Hebrew Places text search */
  placesQueryHe: string
  /** Extra Hebrew Places queries (same category, different intent) */
  placesQueriesHeExtra?: string[]
  /** Extra English Places query terms */
  placesQueryEn: string
  /** Overpass tag filters (OR within category) */
  osmFilters: string[]
}

/** All Places queries for a mapping (primary + extras). */
export function placesQueriesFor(mapping: DiscoveryCategoryMapping): string[] {
  return [mapping.placesQueryHe, ...(mapping.placesQueriesHeExtra ?? [])]
}

/** Legal discovery mappings for Jerusalem recruit categories. */
export const DISCOVERY_CATEGORY_MAP: DiscoveryCategoryMapping[] = [
  {
    slug: 'plumbing',
    placesQueryHe: 'אינסטלטור פרטי',
    placesQueriesHeExtra: ['אינסטלטור נייד', 'דודי שמש טכנאי פרטי'],
    placesQueryEn: 'private plumber',
    osmFilters: ['craft=plumber', 'shop=plumber'],
  },
  {
    slug: 'electricity',
    placesQueryHe: 'חשמלאי מוסמך פרטי',
    placesQueriesHeExtra: ['חשמלאי נייד'],
    placesQueryEn: 'private electrician',
    osmFilters: ['craft=electrician'],
  },
  {
    slug: 'ac',
    placesQueryHe: 'טכנאי מזגנים פרטי',
    placesQueriesHeExtra: ['מתקין מזגנים פרטי'],
    placesQueryEn: 'private air conditioning technician',
    osmFilters: ['craft=hvac', 'shop=air_conditioning'],
  },
  {
    slug: 'cleaning',
    placesQueryHe: 'ניקיון דירות פרטי',
    placesQueriesHeExtra: ['מנקה בתים פרטי'],
    placesQueryEn: 'private house cleaner',
    osmFilters: ['shop=cleaning', 'craft=cleaner'],
  },
  {
    slug: 'painting',
    placesQueryHe: 'צבעי דירות פרטי',
    placesQueriesHeExtra: ['צבעי נייד'],
    placesQueryEn: 'private house painter',
    osmFilters: ['craft=painter'],
  },
  {
    slug: 'carpentry',
    placesQueryHe: 'נגר רהיטים פרטי',
    placesQueriesHeExtra: ['נגר דירות', 'נגר נייד'],
    placesQueryEn: 'private carpenter',
    osmFilters: ['craft=carpenter'],
  },
  {
    slug: 'locksmith',
    placesQueryHe: 'מנעולן נייד',
    placesQueriesHeExtra: ['מנעולן פרטי דלתות'],
    placesQueryEn: 'mobile locksmith',
    osmFilters: ['shop=locksmith', 'craft=locksmith'],
  },
  {
    slug: 'gardening',
    placesQueryHe: 'גנן פרטי',
    placesQueriesHeExtra: ['גיזום עצים פרטי'],
    placesQueryEn: 'private gardener',
    osmFilters: ['craft=gardener'],
  },
  {
    slug: 'moving',
    placesQueryHe: 'הובלות דירה פרטי',
    placesQueriesHeExtra: ['מוביל פרטי ירושלים'],
    placesQueryEn: 'small private moving',
    osmFilters: ['office=moving_company'],
  },
  {
    slug: 'tiling',
    // Avoid bare "קרמיקה" — Places returns retail showrooms
    placesQueryHe: 'רצף דירות פרטי',
    placesQueriesHeExtra: [
      'מתקין קרמיקה פרטי',
      'רצף אריחים',
      'מתקין פרקטים פרטי',
    ],
    placesQueryEn: 'private tile installer',
    osmFilters: ['craft=tiler'],
  },
  {
    slug: 'renovations',
    placesQueryHe: 'קבלן שיפוצים פרטי',
    placesQueriesHeExtra: ['שיפוץ דירה קבלן קטן'],
    placesQueryEn: 'private renovation contractor',
    osmFilters: ['craft=builder', 'office=construction_company'],
  },
  {
    slug: 'waterproofing',
    placesQueryHe: 'איטום גגות פרטי',
    placesQueriesHeExtra: ['איטום רטיבות פרטי'],
    placesQueryEn: 'private waterproofing',
    osmFilters: ['craft=roofer'],
  },
  {
    slug: 'aluminum',
    placesQueryHe: 'אלומיניום חלונות פרטי',
    placesQueriesHeExtra: ['תריסים אלומיניום מתקין'],
    placesQueryEn: 'private aluminum windows',
    osmFilters: ['craft=window_construction', 'shop=window'],
  },
  {
    slug: 'drywall',
    placesQueryHe: 'גבס מתקין פרטי',
    placesQueriesHeExtra: ['טיח וגבס פרטי'],
    placesQueryEn: 'private drywall installer',
    osmFilters: ['craft=plasterer'],
  },
  {
    slug: 'solar',
    placesQueryHe: 'דודי שמש טכנאי פרטי',
    placesQueriesHeExtra: ['מתקין דודי שמש'],
    placesQueryEn: 'private solar water heater technician',
    osmFilters: ['craft=plumber'],
  },
  {
    slug: 'appliance_repair',
    placesQueryHe: 'טכנאי מכשירי חשמל פרטי',
    placesQueriesHeExtra: ['תיקון מכונת כביסה פרטי'],
    placesQueryEn: 'private appliance repair',
    osmFilters: ['craft=electronics_repair', 'shop=electronics'],
  },
  {
    slug: 'pest_control',
    placesQueryHe: 'מדביר פרטי',
    placesQueriesHeExtra: ['הדברה דירות'],
    placesQueryEn: 'private pest control',
    osmFilters: [], // OSM has weak pest-control tagging; Places-only is fine
  },
  {
    slug: 'glazing',
    placesQueryHe: 'זגג פרטי',
    placesQueriesHeExtra: ['החלפת זכוכית חלון'],
    placesQueryEn: 'private glazier',
    osmFilters: ['craft=glaziery', 'shop=glass'],
  },
  {
    slug: 'furniture',
    placesQueryHe: 'הרכבת רהיטים פרטי',
    placesQueriesHeExtra: ['תיקון רהיטים נייד'],
    placesQueryEn: 'private furniture assembly',
    osmFilters: ['craft=cabinet_maker', 'shop=furniture'],
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
