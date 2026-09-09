import {
  CORE_RECRUIT_CATEGORY_SLUGS,
  getRecruitCity,
} from '@/lib/prospects/config'

export type DiscoveryCategoryMapping = {
  slug: (typeof CORE_RECRUIT_CATEGORY_SLUGS)[number] | string
  /** Hebrew label used in Google Places text search */
  placesQueryHe: string
  /** Extra English Places query terms */
  placesQueryEn: string
  /** Overpass tag filters (OR within category) */
  osmFilters: string[]
}

/** Legal discovery mappings for Jerusalem core categories. */
export const DISCOVERY_CATEGORY_MAP: DiscoveryCategoryMapping[] = [
  {
    slug: 'plumbing',
    placesQueryHe: 'אינסטלטור פרטי',
    placesQueryEn: 'private plumber',
    osmFilters: ['craft=plumber', 'shop=plumber'],
  },
  {
    slug: 'electricity',
    placesQueryHe: 'חשמלאי מוסמך פרטי',
    placesQueryEn: 'private electrician',
    osmFilters: ['craft=electrician'],
  },
  {
    slug: 'ac',
    placesQueryHe: 'טכנאי מזגנים פרטי',
    placesQueryEn: 'private air conditioning technician',
    osmFilters: ['craft=hvac', 'shop=air_conditioning'],
  },
  {
    slug: 'cleaning',
    placesQueryHe: 'ניקיון בתים פרטי',
    placesQueryEn: 'private house cleaner',
    osmFilters: ['shop=cleaning', 'craft=cleaner'],
  },
  {
    slug: 'painting',
    placesQueryHe: 'צבעי דירות פרטי',
    placesQueryEn: 'private house painter',
    osmFilters: ['craft=painter'],
  },
  {
    slug: 'carpentry',
    placesQueryHe: 'נגר פרטי',
    placesQueryEn: 'private carpenter',
    osmFilters: ['craft=carpenter'],
  },
  {
    slug: 'locksmith',
    placesQueryHe: 'מנעולן נייד',
    placesQueryEn: 'mobile locksmith',
    osmFilters: ['shop=locksmith', 'craft=locksmith'],
  },
  {
    slug: 'gardening',
    placesQueryHe: 'גנן פרטי',
    placesQueryEn: 'private gardener',
    osmFilters: ['craft=gardener'],
  },
  {
    slug: 'moving',
    placesQueryHe: 'הובלות קטנות פרטי',
    placesQueryEn: 'small private moving',
    osmFilters: ['office=moving_company'],
  },
  {
    slug: 'tiling',
    placesQueryHe: 'רצף פרטי',
    placesQueryEn: 'private tiler',
    osmFilters: ['craft=tiler'],
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
