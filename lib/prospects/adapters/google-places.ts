import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  JERUSALEM_CENTER,
  JERUSALEM_SEARCH_AREAS,
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  placesSearchJobsFor,
  type DiscoveryCategoryMapping,
  type DiscoverySearchArea,
} from '@/lib/prospects/discovery-mapping'
import {
  getDiscoveryPerCategoryCap,
  getDiscoveryTotalBudget,
  getRecruitCategorySlugs,
} from '@/lib/prospects/config'
import {
  scorePersonFit,
  shouldKeepDiscoveredProspect,
} from '@/lib/prospects/person-score'

type PlacesTextSearchResult = {
  places?: Array<{
    id?: string
    name?: string
    formattedAddress?: string
    nationalPhoneNumber?: string
    internationalPhoneNumber?: string
    websiteUri?: string
    googleMapsUri?: string
    displayName?: { text?: string }
  }>
}

/** Places API (New) searchText hard cap per request. */
const PLACES_PAGE_MAX = 20

export type GooglePlacesFetchStats = {
  rawFetched: number
  uniquePlaces: number
  rejectedNoPhone: number
  rejectedFilter: number
  kept: number
  searchCalls: number
  searchErrors: string[]
}

export type GooglePlacesAdapterOptions = {
  apiKey?: string
  categorySlugs?: string[]
  city?: string
  /** Max raw places to fetch across all categories. */
  totalBudget?: number
  /** Override per-category kept-place cap. */
  perCategoryLimit?: number
  searchAreas?: DiscoverySearchArea[]
  fetchImpl?: typeof fetch
}

/**
 * Legal discovery via Google Places API (New).
 * Requires GOOGLE_PLACES_API_KEY. Does not scrape.
 */
export class GooglePlacesProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'google_places'

  private readonly apiKey: string
  private readonly mappings: DiscoveryCategoryMapping[]
  private readonly city: string
  private readonly totalBudget: number
  private readonly perCategoryLimit: number
  private readonly searchAreas: DiscoverySearchArea[]
  private readonly fetchImpl: typeof fetch
  lastStats: GooglePlacesFetchStats = emptyStats()

  constructor(options: GooglePlacesAdapterOptions = {}) {
    const key = options.apiKey ?? process.env.GOOGLE_PLACES_API_KEY?.trim()
    if (!key) {
      throw new Error('GOOGLE_PLACES_API_KEY is missing')
    }
    this.apiKey = key
    this.city = options.city ?? getDiscoveryCity()
    this.fetchImpl = options.fetchImpl ?? fetch
    this.mappings = getDiscoveryMappingsForSlugs(
      options.categorySlugs ?? getRecruitCategorySlugs(),
    )
    this.totalBudget = Math.max(
      1,
      options.totalBudget ?? getDiscoveryTotalBudget(),
    )
    const defaultPerCat = Math.ceil(
      this.totalBudget / Math.max(1, this.mappings.length),
    )
    this.perCategoryLimit = Math.min(
      options.perCategoryLimit ?? defaultPerCat,
      getDiscoveryPerCategoryCap(),
    )
    this.searchAreas = options.searchAreas ?? JERUSALEM_SEARCH_AREAS
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const out: ProspectSourceRecord[] = []
    const seen = new Set<string>()
    const stats = emptyStats()

    for (const mapping of this.mappings) {
      if (stats.rawFetched >= this.totalBudget) break

      const jobs = placesSearchJobsFor(mapping, this.city, this.searchAreas)
      const perQueryLimit = Math.min(
        PLACES_PAGE_MAX,
        Math.max(
          5,
          Math.ceil(this.perCategoryLimit / Math.max(1, Math.min(jobs.length, 12))),
        ),
      )
      let keptForCategory = 0

      for (const job of jobs) {
        if (stats.rawFetched >= this.totalBudget) break
        if (keptForCategory >= this.perCategoryLimit) break

        let places: NonNullable<PlacesTextSearchResult['places']> = []
        try {
          places = await this.textSearch(job.textQuery, perQueryLimit, job.area)
          stats.searchCalls += 1
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Places search failed'
          stats.searchErrors.push(message)
          // Continue other neighborhoods/queries — don't abort the whole run
          continue
        }

        stats.rawFetched += places.length

        for (const place of places) {
          const placeId = place.id?.trim()
          if (!placeId || seen.has(placeId)) continue
          seen.add(placeId)
          stats.uniquePlaces += 1

          const name =
            place.displayName?.text?.trim() ||
            place.name?.trim() ||
            job.textQuery
          const phone =
            place.nationalPhoneNumber?.trim() ||
            place.internationalPhoneNumber?.trim() ||
            null
          if (!phone) {
            stats.rejectedNoPhone += 1
            continue
          }
          if (
            !shouldKeepDiscoveredProspect({
              name,
              businessName: name,
              phone,
            })
          ) {
            stats.rejectedFilter += 1
            continue
          }

          const fit = scorePersonFit(name, name)
          const addressNote = place.formattedAddress
            ? `כתובת: ${place.formattedAddress}`
            : null
          const fitNote = `דירוג התאמה: ${fit.score} (${fit.kind}) · נייד`

          out.push({
            name,
            businessName: name,
            phone,
            whatsappPhone: phone,
            city: this.city,
            categorySlug: mapping.slug,
            sourceName: 'google_places',
            sourceUrl: place.googleMapsUri || place.websiteUri || null,
            externalId: placeId,
            notes: [addressNote, fitNote].filter(Boolean).join(' · '),
            fitScore: fit.score,
            verificationStatus: 'unverified',
          })
          keptForCategory += 1
          stats.kept += 1

          if (keptForCategory >= this.perCategoryLimit) break
        }
      }
    }

    this.lastStats = stats
    out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    return out
  }

  private async textSearch(
    textQuery: string,
    maxResultCount: number,
    area?: DiscoverySearchArea,
  ): Promise<NonNullable<PlacesTextSearchResult['places']>> {
    const center = area ?? {
      lat: JERUSALEM_CENTER.lat,
      lng: JERUSALEM_CENTER.lng,
      radiusMeters: JERUSALEM_CENTER.radiusMeters,
      labelHe: this.city,
    }

    const res = await this.fetchImpl(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri',
        },
        body: JSON.stringify({
          textQuery,
          languageCode: 'he',
          regionCode: 'IL',
          maxResultCount: Math.min(maxResultCount, PLACES_PAGE_MAX),
          locationBias: {
            circle: {
              center: {
                latitude: center.lat,
                longitude: center.lng,
              },
              radius: center.radiusMeters,
            },
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `Google Places search failed (${res.status}): ${body.slice(0, 300)}`,
      )
    }

    const json = (await res.json()) as PlacesTextSearchResult
    return json.places ?? []
  }
}

function emptyStats(): GooglePlacesFetchStats {
  return {
    rawFetched: 0,
    uniquePlaces: 0,
    rejectedNoPhone: 0,
    rejectedFilter: 0,
    kept: 0,
    searchCalls: 0,
    searchErrors: [],
  }
}
