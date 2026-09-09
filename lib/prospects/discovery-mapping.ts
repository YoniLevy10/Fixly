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
    placesQueryHe: 'אינסטלטור',
    placesQueryEn: 'plumber',
    osmFilters: ['craft=plumber', 'shop=plumber'],
  },
  {
    slug: 'electricity',
    placesQueryHe: 'חשמלאי',
    placesQueryEn: 'electrician',
    osmFilters: ['craft=electrician'],
  },
  {
    slug: 'ac',
    placesQueryHe: 'טכנאי מזגנים',
    placesQueryEn: 'air conditioning repair',
    osmFilters: ['craft=hvac', 'shop=air_conditioning'],
  },
  {
    slug: 'cleaning',
    placesQueryHe: 'ניקיון בתים',
    placesQueryEn: 'house cleaning service',
    osmFilters: ['shop=cleaning', 'craft=cleaner'],
  },
  {
    slug: 'painting',
    placesQueryHe: 'צבעי דירות',
    placesQueryEn: 'house painter',
    osmFilters: ['craft=painter'],
  },
  {
    slug: 'carpentry',
    placesQueryHe: 'נגר',
    placesQueryEn: 'carpenter',
    osmFilters: ['craft=carpenter', 'shop=furniture'],
  },
  {
    slug: 'locksmith',
    placesQueryHe: 'מנעולן',
    placesQueryEn: 'locksmith',
    osmFilters: ['shop=locksmith', 'craft=locksmith'],
  },
  {
    slug: 'gardening',
    placesQueryHe: 'גנן',
    placesQueryEn: 'gardener landscaping',
    osmFilters: ['craft=gardener', 'shop=garden_centre'],
  },
  {
    slug: 'moving',
    placesQueryHe: 'הובלות',
    placesQueryEn: 'moving company',
    osmFilters: ['office=moving_company', 'shop=storage_rental'],
  },
  {
    slug: 'tiling',
    placesQueryHe: 'רצף',
    placesQueryEn: 'tiler flooring',
    osmFilters: ['craft=tiler', 'shop=tiles'],
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
