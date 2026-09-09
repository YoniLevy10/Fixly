import {
  CORE_RECRUIT_CATEGORY_SLUGS,
  getRecruitCity,
} from '@/lib/prospects/config'

export type DiscoveryCategoryMapping = {
  slug: (typeof CORE_RECRUIT_CATEGORY_SLUGS)[number] | string
  /** Simple natural Hebrew craft name */
  placesQueryHe: string
  /** Extra Hebrew: services + natural variants (not always "מומלץ/נייד") */
  placesQueriesHeExtra?: string[]
  placesQueryEn: string
  placesQueriesEnExtra?: string[]
  placesQueryAr?: string
  placesQueriesArExtra?: string[]
  osmFilters: string[]
}

export type DiscoverySearchArea = {
  labelHe: string
  labelAr?: string
  labelEn?: string
  lat: number
  lng: number
  radiusMeters: number
}

export type CityGeoProfile = {
  city: string
  center: { lat: number; lng: number; radiusMeters: number }
  bbox: { south: number; west: number; north: number; east: number }
  areas: DiscoverySearchArea[]
}

/** Approximate Jerusalem bbox for Overpass (south,west,north,east). */
export const JERUSALEM_BBOX = {
  south: 31.72,
  west: 35.14,
  north: 31.87,
  east: 35.28,
} as const

export const JERUSALEM_CENTER = {
  lat: 31.7683,
  lng: 35.2137,
  radiusMeters: 12000,
} as const

export const JERUSALEM_SEARCH_AREAS: DiscoverySearchArea[] = [
  {
    labelHe: 'ירושלים',
    labelAr: 'القدس',
    labelEn: 'Jerusalem',
    lat: 31.7683,
    lng: 35.2137,
    radiusMeters: 14000,
  },
  {
    labelHe: 'פסגת זאב',
    labelEn: 'Pisgat Zeev',
    lat: 31.8255,
    lng: 35.2385,
    radiusMeters: 4500,
  },
  {
    labelHe: 'רמות',
    labelEn: 'Ramot',
    lat: 31.812,
    lng: 35.194,
    radiusMeters: 4500,
  },
  {
    labelHe: 'גילה',
    labelEn: 'Gilo',
    lat: 31.7315,
    lng: 35.1885,
    radiusMeters: 4000,
  },
  {
    labelHe: 'תלפיות',
    labelEn: 'Talpiot',
    lat: 31.75,
    lng: 35.22,
    radiusMeters: 4000,
  },
  {
    labelHe: 'בית הכרם',
    labelEn: 'Beit Hakerem',
    lat: 31.78,
    lng: 35.19,
    radiusMeters: 4000,
  },
  {
    labelHe: 'קטמון',
    labelEn: 'Katamon',
    lat: 31.76,
    lng: 35.205,
    radiusMeters: 4000,
  },
  {
    labelHe: 'מלחה',
    labelEn: 'Malha',
    lat: 31.751,
    lng: 35.188,
    radiusMeters: 4000,
  },
  {
    labelHe: 'ארמון הנציב',
    labelEn: 'East Talpiot',
    lat: 31.754,
    lng: 35.236,
    radiusMeters: 4000,
  },
  {
    labelHe: 'נווה יעקב',
    labelEn: 'Neve Yaakov',
    lat: 31.84,
    lng: 35.24,
    radiusMeters: 4000,
  },
]

export const CITY_GEO_PROFILES: Record<string, CityGeoProfile> = {
  ירושלים: {
    city: 'ירושלים',
    center: { ...JERUSALEM_CENTER },
    bbox: { ...JERUSALEM_BBOX },
    areas: JERUSALEM_SEARCH_AREAS,
  },
  Jerusalem: {
    city: 'ירושלים',
    center: { ...JERUSALEM_CENTER },
    bbox: { ...JERUSALEM_BBOX },
    areas: JERUSALEM_SEARCH_AREAS,
  },
}

/**
 * Resolve geo for a recruit city. Non-Jerusalem cities use a single
 * text-biased center from env or a neutral IL fallback — never Jerusalem bbox.
 */
export function getCityGeoProfile(city?: string | null): CityGeoProfile {
  const c = (city ?? getRecruitCity()).trim()
  const known = CITY_GEO_PROFILES[c]
  if (known) return known

  const lat = Number(process.env.FIXLY_RECRUIT_CITY_LAT)
  const lng = Number(process.env.FIXLY_RECRUIT_CITY_LNG)
  const radius = Number(process.env.FIXLY_RECRUIT_CITY_RADIUS_M) || 12000
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const delta = radius / 111_000
    return {
      city: c,
      center: { lat, lng, radiusMeters: radius },
      bbox: {
        south: lat - delta,
        west: lng - delta,
        north: lat + delta,
        east: lng + delta,
      },
      areas: [
        {
          labelHe: c,
          lat,
          lng,
          radiusMeters: radius,
        },
      ],
    }
  }

  // Text-only fallback: still provide a center for bias but label = city
  return {
    city: c,
    center: { lat: 31.7683, lng: 34.8, radiusMeters: 15000 },
    bbox: {
      south: 31.5,
      west: 34.6,
      north: 32.1,
      east: 35.0,
    },
    areas: [{ labelHe: c, lat: 31.7683, lng: 34.8, radiusMeters: 15000 }],
  }
}

/**
 * Legal discovery mappings — natural craft queries + service variants.
 * Avoid always appending מומלץ/נייד/עצמאי.
 */
export const DISCOVERY_CATEGORY_MAP: DiscoveryCategoryMapping[] = [
  {
    slug: 'plumbing',
    placesQueryHe: 'אינסטלטור',
    placesQueriesHeExtra: [
      'שרברב',
      'פתיחת סתימות',
      'תיקון נזילות',
      'החלפת ברז',
      'אינסטלטור ירושלים',
    ],
    placesQueryEn: 'plumber',
    placesQueriesEnExtra: ['drain cleaning', 'leak repair'],
    placesQueryAr: 'سباك',
    placesQueriesArExtra: ['فتح مجاري', 'تصليح تسريبات'],
    osmFilters: ['craft=plumber'],
  },
  {
    slug: 'electricity',
    placesQueryHe: 'חשמלאי',
    placesQueriesHeExtra: ['חשמלאי מוסמך', 'תיקון קצר חשמלי', 'התקנת נקודת חשמל'],
    placesQueryEn: 'electrician',
    placesQueriesEnExtra: ['licensed electrician'],
    placesQueryAr: 'كهربائي',
    osmFilters: ['craft=electrician'],
  },
  {
    slug: 'ac',
    placesQueryHe: 'טכנאי מזגנים',
    placesQueriesHeExtra: ['מילוי גז מזגן', 'התקנת מזגן', 'תיקון מזגן'],
    placesQueryEn: 'AC technician',
    placesQueriesEnExtra: ['air conditioner repair'],
    placesQueryAr: 'فني تكييف',
    osmFilters: ['craft=hvac'],
  },
  {
    slug: 'cleaning',
    placesQueryHe: 'ניקיון דירות',
    placesQueriesHeExtra: ['מנקה דירות', 'ניקיון אחרי שיפוץ'],
    placesQueryEn: 'house cleaning',
    placesQueryAr: 'تنظيف منازل',
    osmFilters: ['craft=cleaner'],
  },
  {
    slug: 'painting',
    placesQueryHe: 'צבעי',
    placesQueriesHeExtra: ['צבעי דירות', 'צביעת דירה'],
    placesQueryEn: 'house painter',
    placesQueryAr: 'دهان',
    osmFilters: ['craft=painter'],
  },
  {
    slug: 'carpentry',
    placesQueryHe: 'נגר',
    placesQueriesHeExtra: ['נגר רהיטים', 'תיקון דלתות'],
    placesQueryEn: 'carpenter',
    placesQueryAr: 'نجار',
    osmFilters: ['craft=carpenter'],
  },
  {
    slug: 'locksmith',
    placesQueryHe: 'מנעולן',
    placesQueriesHeExtra: ['פתיחת דלתות', 'החלפת מנעול'],
    placesQueryEn: 'locksmith',
    placesQueryAr: 'صانع مفاتيح',
    osmFilters: ['craft=locksmith'],
  },
  {
    slug: 'gardening',
    placesQueryHe: 'גנן',
    placesQueriesHeExtra: ['גיזום עצים', 'טיפול בגינה'],
    placesQueryEn: 'gardener',
    placesQueryAr: 'بستاني',
    osmFilters: ['craft=gardener'],
  },
  {
    slug: 'moving',
    placesQueryHe: 'הובלות',
    placesQueriesHeExtra: ['הובלת דירה', 'הובלות קטנות'],
    placesQueryEn: 'movers',
    placesQueryAr: 'نقل عفش',
    osmFilters: ['office=moving_company'],
  },
  {
    slug: 'tiling',
    placesQueryHe: 'רצף',
    placesQueriesHeExtra: ['התקנת קרמיקה', 'רצף דירות', 'התקנת פרקט'],
    placesQueryEn: 'tile installer',
    placesQueryAr: 'بلاط',
    osmFilters: ['craft=tiler'],
  },
  {
    slug: 'renovations',
    placesQueryHe: 'שיפוצים',
    placesQueriesHeExtra: ['קבלן שיפוצים', 'שיפוצניק'],
    placesQueryEn: 'home renovation',
    placesQueryAr: 'ترميم منازل',
    osmFilters: ['craft=builder'],
  },
  {
    slug: 'waterproofing',
    placesQueryHe: 'איטום',
    placesQueriesHeExtra: ['איטום גגות', 'איטום רטיבות'],
    placesQueryEn: 'waterproofing',
    placesQueryAr: 'عزل رطوبة',
    osmFilters: ['craft=roofer'],
  },
  {
    slug: 'aluminum',
    placesQueryHe: 'אלומיניום',
    placesQueriesHeExtra: ['התקנת תריסים', 'חלונות אלומיניום'],
    placesQueryEn: 'aluminum windows',
    placesQueryAr: 'ألمنيوم',
    osmFilters: ['craft=window_construction'],
  },
  {
    slug: 'drywall',
    placesQueryHe: 'גבס',
    placesQueriesHeExtra: ['התקנת גבס', 'טייח'],
    placesQueryEn: 'drywall',
    placesQueryAr: 'جبس',
    osmFilters: ['craft=plasterer'],
  },
  {
    slug: 'solar',
    placesQueryHe: 'דוד שמש',
    placesQueriesHeExtra: ['טכנאי דודי שמש', 'התקנת דוד שמש'],
    placesQueryEn: 'solar water heater',
    placesQueryAr: 'سخان شمسي',
    osmFilters: ['craft=plumber'],
  },
  {
    slug: 'appliance_repair',
    placesQueryHe: 'טכנאי מכשירי חשמל',
    placesQueriesHeExtra: ['תיקון מכונת כביסה', 'תיקון מקרר'],
    placesQueryEn: 'appliance repair',
    placesQueryAr: 'تصليح اجهزة',
    osmFilters: ['craft=electronics_repair'],
  },
  {
    slug: 'pest_control',
    placesQueryHe: 'מדביר',
    placesQueriesHeExtra: ['הדברה', 'הדברת דירות'],
    placesQueryEn: 'pest control',
    placesQueryAr: 'مكافحة حشرات',
    osmFilters: [],
  },
  {
    slug: 'glazing',
    placesQueryHe: 'זגג',
    placesQueriesHeExtra: ['החלפת זכוכית', 'תיקון חלון'],
    placesQueryEn: 'glazier',
    placesQueryAr: 'زجاج',
    osmFilters: ['craft=glaziery'],
  },
  {
    slug: 'furniture',
    placesQueryHe: 'הרכבת רהיטים',
    placesQueriesHeExtra: ['תיקון רהיטים', 'הרכבת איקאה'],
    placesQueryEn: 'furniture assembly',
    placesQueryAr: 'تركيب اثاث',
    osmFilters: ['craft=cabinet_maker'],
  },
]

export function placesQueriesFor(mapping: DiscoveryCategoryMapping): string[] {
  const out = [
    mapping.placesQueryHe,
    ...(mapping.placesQueriesHeExtra ?? []),
    mapping.placesQueryEn,
    ...(mapping.placesQueriesEnExtra ?? []),
  ]
  if (mapping.placesQueryAr) out.push(mapping.placesQueryAr)
  if (mapping.placesQueriesArExtra) out.push(...mapping.placesQueriesArExtra)
  return out.map((q) => q.trim()).filter(Boolean)
}

export type PlacesSearchJob = {
  textQuery: string
  area: DiscoverySearchArea
  queryKey: string
  categorySlug: string
  languageCode: 'he' | 'en' | 'ar'
}

function detectLang(query: string, mapping: DiscoveryCategoryMapping): 'he' | 'en' | 'ar' {
  if (mapping.placesQueryAr && query === mapping.placesQueryAr) return 'ar'
  if (mapping.placesQueriesArExtra?.includes(query)) return 'ar'
  if (/[\u0600-\u06FF]/.test(query)) return 'ar'
  if (/[A-Za-z]/.test(query) && !/[\u0590-\u05FF]/.test(query)) return 'en'
  return 'he'
}

export function areaLabelForLang(
  area: DiscoverySearchArea,
  lang: 'he' | 'en' | 'ar',
  city: string,
): string {
  if (lang === 'ar') return area.labelAr || area.labelHe || city
  if (lang === 'en') return area.labelEn || area.labelHe || city
  return area.labelHe || city
}

/**
 * Build all candidate jobs (before budgeted rotation).
 * City-wide: all language variants. Neighborhoods: primary HE/AR/EN only.
 */
export function placesSearchJobsFor(
  mapping: DiscoveryCategoryMapping,
  city: string,
  areas?: DiscoverySearchArea[],
): PlacesSearchJob[] {
  const profile = getCityGeoProfile(city)
  const searchAreas = areas ?? profile.areas
  const allQueries = placesQueriesFor(mapping)
  const primaryQueries = [
    mapping.placesQueryHe,
    mapping.placesQueryEn,
    mapping.placesQueryAr,
  ].filter(Boolean) as string[]

  const jobs: PlacesSearchJob[] = []
  for (const area of searchAreas) {
    const isCityWide =
      area.labelHe === city ||
      area.labelHe === profile.city ||
      area.labelHe === 'ירושלים' ||
      searchAreas.length === 1
    const queries = isCityWide ? allQueries : primaryQueries
    for (const queryBase of queries) {
      const lang = detectLang(queryBase, mapping)
      const placeLabel = isCityWide
        ? areaLabelForLang(area, lang, city)
        : areaLabelForLang(area, lang, area.labelHe)
      const textQuery = `${queryBase} ${placeLabel}`.trim()
      jobs.push({
        textQuery,
        area,
        queryKey: `${mapping.slug}|${lang}|${queryBase}|${area.labelHe}`,
        categorySlug: mapping.slug,
        languageCode: lang,
      })
    }
  }
  return jobs
}

export const ALLOWED_DISCOVERY_SOURCES = [
  'google_places',
  'osm',
  'gov_pest_control',
  'manual',
  'csv',
] as const

export type AllowedDiscoverySource = (typeof ALLOWED_DISCOVERY_SOURCES)[number]

export function isAllowedDiscoverySource(name: string): boolean {
  return (ALLOWED_DISCOVERY_SOURCES as readonly string[]).includes(name)
}

export function getDiscoveryCity(): string {
  return getRecruitCity()
}

export function getDiscoveryMappingsForSlugs(
  slugs: string[],
): DiscoveryCategoryMapping[] {
  const set = new Set(slugs)
  return DISCOVERY_CATEGORY_MAP.filter((m) => set.has(m.slug))
}
