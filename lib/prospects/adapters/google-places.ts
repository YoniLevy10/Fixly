import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  JERUSALEM_CENTER,
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  placesQueriesFor,
  type DiscoveryCategoryMapping,
} from '@/lib/prospects/discovery-mapping'
import {
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

export type GooglePlacesAdapterOptions = {
  apiKey?: string
  categorySlugs?: string[]
  city?: string
  /** Max raw places to fetch across all categories (default 500). */
  totalBudget?: number
  /** Override per-category raw place cap. */
  perCategoryLimit?: number
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
  private readonly fetchImpl: typeof fetch

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
      80,
    )
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const out: ProspectSourceRecord[] = []
    const seen = new Set<string>()
    let rawFetched = 0

    for (const mapping of this.mappings) {
      if (rawFetched >= this.totalBudget) break

      const queries = placesQueriesFor(mapping)
      const perQueryLimit = Math.min(
        PLACES_PAGE_MAX,
        Math.max(5, Math.ceil(this.perCategoryLimit / queries.length)),
      )
      let keptForCategory = 0

      for (const queryBase of queries) {
        if (rawFetched >= this.totalBudget) break
        if (keptForCategory >= this.perCategoryLimit) break

        const query = `${queryBase} ${this.city}`
        const places = await this.textSearch(query, perQueryLimit)
        rawFetched += places.length

        for (const place of places) {
          const placeId = place.id?.trim()
          if (!placeId || seen.has(placeId)) continue
          seen.add(placeId)

          const name =
            place.displayName?.text?.trim() ||
            place.name?.trim() ||
            queryBase
          const phone =
            place.nationalPhoneNumber?.trim() ||
            place.internationalPhoneNumber?.trim() ||
            null
          if (!phone) continue
          if (
            !shouldKeepDiscoveredProspect({
              name,
              businessName: name,
              phone,
            })
          ) {
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

          if (keptForCategory >= this.perCategoryLimit) break
        }
      }
    }

    out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    return out
  }

  private async textSearch(
    textQuery: string,
    maxResultCount: number,
  ): Promise<NonNullable<PlacesTextSearchResult['places']>> {
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
                latitude: JERUSALEM_CENTER.lat,
                longitude: JERUSALEM_CENTER.lng,
              },
              radius: JERUSALEM_CENTER.radiusMeters,
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
