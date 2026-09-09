import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  getCityGeoProfile,
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  placesSearchJobsFor,
  type DiscoveryCategoryMapping,
  type DiscoverySearchArea,
  type PlacesSearchJob,
} from '@/lib/prospects/discovery-mapping'
import {
  getDiscoveryApiCallBudget,
  getDiscoveryPerCategoryCap,
  getDiscoveryTotalBudget,
  getRecruitCategorySlugs,
} from '@/lib/prospects/config'
import {
  assessProspectFit,
  shouldKeepDiscoveredProspect,
} from '@/lib/prospects/fit-score'
import {
  computeYieldScore,
  selectJobsForBudget,
  type QueryStatRow,
  type QueryYieldUpdate,
} from '@/lib/prospects/query-queue'

type PlacesTextSearchResult = {
  places?: Array<{
    id?: string
    name?: string
    formattedAddress?: string
    nationalPhoneNumber?: string
    internationalPhoneNumber?: string
    websiteUri?: string
    googleMapsUri?: string
    types?: string[]
    pureServiceAreaBusiness?: boolean
    displayName?: { text?: string }
  }>
  nextPageToken?: string
}

const PLACES_PAGE_MAX = 20

/**
 * Field mask cost note (Places API New):
 * - id, displayName, formattedAddress, nationalPhoneNumber, internationalPhoneNumber,
 *   websiteUri, googleMapsUri → typically Text Essentials / Pro contact fields
 * - types, pureServiceAreaBusiness → modest extras for classification
 * - nextPageToken → required for pagination (must be listed or token is omitted)
 * Avoid requesting reviews/photos/atmosphere (Enterprise) unless enrichment justifies cost.
 */
const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.types',
  'places.pureServiceAreaBusiness',
  'nextPageToken',
].join(',')

export type GooglePlacesFetchStats = {
  rawFetched: number
  uniquePlaces: number
  rejectedNoPhone: number
  rejectedFilter: number
  kept: number
  suitable: number
  needsReview: number
  searchCalls: number
  searchErrors: string[]
  stopReason: string | null
  queryYields: QueryYieldUpdate[]
}

export type GooglePlacesAdapterOptions = {
  apiKey?: string
  categorySlugs?: string[]
  city?: string
  totalBudget?: number
  apiCallBudget?: number
  perCategoryLimit?: number
  searchAreas?: DiscoverySearchArea[]
  queryStats?: QueryStatRow[]
  fetchImpl?: typeof fetch
  /** Fired after each search call / job step for UI progress */
  onProgress?: (p: {
    jobsDone: number
    jobsTotal: number
    searchCalls: number
    apiCallBudget: number
  }) => void | Promise<void>
}

export class GooglePlacesProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'google_places'

  private readonly apiKey: string
  private readonly mappings: DiscoveryCategoryMapping[]
  private readonly city: string
  private readonly totalBudget: number
  private readonly apiCallBudget: number
  private readonly perCategoryLimit: number
  private readonly searchAreas: DiscoverySearchArea[]
  private readonly queryStats: QueryStatRow[]
  private readonly fetchImpl: typeof fetch
  private readonly onProgress?: GooglePlacesAdapterOptions['onProgress']
  lastStats: GooglePlacesFetchStats = emptyStats()

  constructor(options: GooglePlacesAdapterOptions = {}) {
    const key = options.apiKey ?? process.env.GOOGLE_PLACES_API_KEY?.trim()
    if (!key) {
      throw new Error('GOOGLE_PLACES_API_KEY is missing')
    }
    this.apiKey = key
    this.city = options.city ?? getDiscoveryCity()
    this.fetchImpl = options.fetchImpl ?? fetch
    this.onProgress = options.onProgress
    this.mappings = getDiscoveryMappingsForSlugs(
      options.categorySlugs ?? getRecruitCategorySlugs(),
    )
    this.totalBudget = Math.max(
      1,
      options.totalBudget ?? getDiscoveryTotalBudget(),
    )
    this.apiCallBudget = Math.max(
      1,
      options.apiCallBudget ?? getDiscoveryApiCallBudget(),
    )
    const defaultPerCat = Math.ceil(
      this.totalBudget / Math.max(1, this.mappings.length),
    )
    this.perCategoryLimit = Math.min(
      options.perCategoryLimit ?? defaultPerCat,
      getDiscoveryPerCategoryCap(),
    )
    const profile = getCityGeoProfile(this.city)
    this.searchAreas = options.searchAreas ?? profile.areas
    this.queryStats = options.queryStats ?? []
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const out: ProspectSourceRecord[] = []
    const seen = new Set<string>()
    const stats = emptyStats()
    const yieldMap = new Map<string, QueryYieldUpdate>()

    const allJobs: PlacesSearchJob[] = []
    for (const mapping of this.mappings) {
      allJobs.push(
        ...placesSearchJobsFor(mapping, this.city, this.searchAreas),
      )
    }

    // Cap jobs by API call budget (each job may paginate — reserve ~2 pages avg)
    const jobBudget = Math.max(1, Math.floor(this.apiCallBudget * 0.7))
    const selected = selectJobsForBudget(allJobs, this.queryStats, jobBudget)
    const keptByCategory = new Map<string, number>()
    let jobsDone = 0

    const emitProgress = async () => {
      if (!this.onProgress) return
      try {
        await this.onProgress({
          jobsDone,
          jobsTotal: selected.length,
          searchCalls: stats.searchCalls,
          apiCallBudget: this.apiCallBudget,
        })
      } catch {
        /* ignore progress errors */
      }
    }

    for (const job of selected) {
      if (stats.searchCalls >= this.apiCallBudget) {
        stats.stopReason = 'api_call_budget'
        break
      }
      if (stats.rawFetched >= this.totalBudget) {
        stats.stopReason = 'raw_result_budget'
        break
      }
      const keptCat = keptByCategory.get(job.categorySlug) ?? 0
      if (keptCat >= this.perCategoryLimit) {
        jobsDone += 1
        continue
      }

      const yieldRow = yieldMap.get(job.queryKey) ?? {
        queryKey: job.queryKey,
        city: this.city,
        sourceName: 'google_places',
        raw: 0,
        uniqueNew: 0,
        suitable: 0,
        needsReview: 0,
        unsuitable: 0,
        apiCalls: 0,
      }

      let pageToken: string | undefined
      let pages = 0
      let newOnLastPage = 0

      try {
        do {
          if (stats.searchCalls >= this.apiCallBudget) {
            stats.stopReason = 'api_call_budget'
            break
          }
          const { places, nextPageToken } = await this.textSearch(
            job,
            PLACES_PAGE_MAX,
            pageToken,
          )
          stats.searchCalls += 1
          yieldRow.apiCalls += 1
          pages += 1
          stats.rawFetched += places.length
          yieldRow.raw += places.length
          newOnLastPage = 0

          for (const place of places) {
            const placeId = place.id?.trim()
            if (!placeId) continue
            if (seen.has(placeId)) continue
            seen.add(placeId)
            stats.uniquePlaces += 1
            newOnLastPage += 1
            yieldRow.uniqueNew += 1

            const name =
              place.displayName?.text?.trim() ||
              place.name?.trim() ||
              job.textQuery
            const phone =
              place.nationalPhoneNumber?.trim() ||
              place.internationalPhoneNumber?.trim() ||
              null
            const website = place.websiteUri?.trim() || null
            const address = place.formattedAddress?.trim() || null
            const placeTypes = place.types ?? []
            const sab = Boolean(place.pureServiceAreaBusiness)

            const assessment = assessProspectFit({
              name,
              businessName: name,
              phone,
              websiteUrl: website,
              address,
              placeTypes,
              pureServiceAreaBusiness: sab,
              searchAreaHint: job.area.labelHe,
            })

            if (assessment.fitClass === 'unsuitable') {
              stats.rejectedFilter += 1
              yieldRow.unsuitable += 1
              continue
            }

            if (
              !shouldKeepDiscoveredProspect({
                name,
                businessName: name,
                phone,
                websiteUrl: website,
                address,
                placeTypes,
                pureServiceAreaBusiness: sab,
                searchAreaHint: job.area.labelHe,
              })
            ) {
              stats.rejectedFilter += 1
              continue
            }

            if (!phone) {
              // Still keep if suitable/needs_review — contactability = none
              stats.rejectedNoPhone += 1
            }

            if (assessment.fitClass === 'suitable') {
              stats.suitable += 1
              yieldRow.suitable += 1
            } else if (assessment.fitClass === 'needs_review') {
              stats.needsReview += 1
              yieldRow.needsReview += 1
            }

            const fitNote = `דירוג: ${assessment.score} · ${assessment.fitClass} · ביטחון ${assessment.confidence} · קשר: ${assessment.contactability}`

            out.push({
              name,
              businessName: name,
              phone,
              whatsappPhone: assessment.contactability === 'mobile' ? phone : null,
              city: this.city,
              searchCity: this.city,
              businessAddress: address,
              categorySlug: job.categorySlug,
              sourceName: 'google_places',
              sourceUrl: place.googleMapsUri || website || null,
              externalId: placeId,
              notes: [address ? `כתובת: ${address}` : null, fitNote]
                .filter(Boolean)
                .join(' · '),
              fitScore: assessment.score,
              fitClass: assessment.fitClass,
              fitConfidence: assessment.confidence,
              fitReasons: assessment.reasons,
              contactability: assessment.contactability,
              queryKey: job.queryKey,
              placeTypes,
              pureServiceAreaBusiness: sab,
              verificationStatus: 'unverified',
            })
            stats.kept += 1
            keptByCategory.set(
              job.categorySlug,
              (keptByCategory.get(job.categorySlug) ?? 0) + 1,
            )
          }

          pageToken = nextPageToken
          // Stop paging when no new unique places (low utility)
          if (pageToken && newOnLastPage === 0) {
            stats.stopReason = stats.stopReason ?? 'low_page_utility'
            break
          }
          // Soft max 3 pages per query
          if (pages >= 3) break
        } while (pageToken)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Places search failed'
        stats.searchErrors.push(`${job.queryKey}: ${message}`)
      }

      jobsDone += 1
      yieldMap.set(job.queryKey, yieldRow)
      await emitProgress()
    }

    await emitProgress()

    if (!stats.stopReason && stats.searchCalls >= this.apiCallBudget) {
      stats.stopReason = 'api_call_budget'
    }

    stats.queryYields = [...yieldMap.values()].map((y) => ({
      ...y,
      // attach computed score for persistence helpers
    }))
    // annotate yield score for callers
    for (const y of stats.queryYields) {
      ;(y as QueryYieldUpdate & { yieldScore?: number }).yieldScore =
        computeYieldScore(y)
    }

    this.lastStats = stats
    out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    return out
  }

  private async textSearch(
    job: PlacesSearchJob,
    pageSize: number,
    pageToken?: string,
  ): Promise<{
    places: NonNullable<PlacesTextSearchResult['places']>
    nextPageToken?: string
  }> {
    const body: Record<string, unknown> = {
      textQuery: job.textQuery,
      languageCode: job.languageCode,
      regionCode: 'IL',
      pageSize: Math.min(pageSize, PLACES_PAGE_MAX),
      includePureServiceAreaBusinesses: true,
      locationBias: {
        circle: {
          center: {
            latitude: job.area.lat,
            longitude: job.area.lng,
          },
          radius: job.area.radiusMeters,
        },
      },
    }
    if (pageToken) body.pageToken = pageToken

    const res = await this.fetchImpl(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': PLACES_FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      },
    )

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(
        `Google Places search failed (${res.status}): ${errBody.slice(0, 300)}`,
      )
    }

    const json = (await res.json()) as PlacesTextSearchResult
    return {
      places: json.places ?? [],
      nextPageToken: json.nextPageToken,
    }
  }
}

function emptyStats(): GooglePlacesFetchStats {
  return {
    rawFetched: 0,
    uniquePlaces: 0,
    rejectedNoPhone: 0,
    rejectedFilter: 0,
    kept: 0,
    suitable: 0,
    needsReview: 0,
    searchCalls: 0,
    searchErrors: [],
    stopReason: null,
    queryYields: [],
  }
}
