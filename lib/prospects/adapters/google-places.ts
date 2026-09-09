import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  JERUSALEM_CENTER,
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  type DiscoveryCategoryMapping,
} from '@/lib/prospects/discovery-mapping'
import { getRecruitCategorySlugs } from '@/lib/prospects/config'
import {
  scorePersonFit,
  shouldKeepAsSoloProspect,
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

export type GooglePlacesAdapterOptions = {
  apiKey?: string
  categorySlugs?: string[]
  city?: string
  /** Max places to fetch per category (keeps cost bounded). */
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
  private readonly perCategoryLimit: number
  private readonly fetchImpl: typeof fetch

  constructor(options: GooglePlacesAdapterOptions = {}) {
    const key = options.apiKey ?? process.env.GOOGLE_PLACES_API_KEY?.trim()
    if (!key) {
      throw new Error('GOOGLE_PLACES_API_KEY is missing')
    }
    this.apiKey = key
    this.city = options.city ?? getDiscoveryCity()
    this.perCategoryLimit = Math.min(options.perCategoryLimit ?? 20, 40)
    this.fetchImpl = options.fetchImpl ?? fetch
    this.mappings = getDiscoveryMappingsForSlugs(
      options.categorySlugs ?? getRecruitCategorySlugs(),
    )
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const out: ProspectSourceRecord[] = []
    const seen = new Set<string>()

    for (const mapping of this.mappings) {
      const query = `${mapping.placesQueryHe} ${this.city}`
      const places = await this.textSearch(query)
      for (const place of places.slice(0, this.perCategoryLimit)) {
        const placeId = place.id?.trim()
        if (!placeId || seen.has(placeId)) continue
        seen.add(placeId)

        const name =
          place.displayName?.text?.trim() ||
          place.name?.trim() ||
          mapping.placesQueryHe
        const phone =
          place.nationalPhoneNumber?.trim() ||
          place.internationalPhoneNumber?.trim() ||
          null
        if (!phone) continue
        if (!shouldKeepAsSoloProspect(name, name)) continue

        const fit = scorePersonFit(name, name)
        const addressNote = place.formattedAddress
          ? `כתובת: ${place.formattedAddress}`
          : null
        const fitNote = `התאמת פרטי: ${fit.kind} (${fit.score})`

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
          verificationStatus: 'unverified',
        })
      }
    }

    out.sort((a, b) => {
      const sa = scorePersonFit(a.name, a.businessName).score
      const sb = scorePersonFit(b.name, b.businessName).score
      return sb - sa
    })

    return out
  }

  private async textSearch(textQuery: string): Promise<
    NonNullable<PlacesTextSearchResult['places']>
  > {
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
          maxResultCount: this.perCategoryLimit,
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
