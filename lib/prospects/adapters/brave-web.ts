import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  DISCOVERY_BRAVE_SITES_PER_QUERY,
  getDiscoveryBraveCallBudget,
  getRecruitCategorySlugs,
} from '@/lib/prospects/config'
import {
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  placesQueriesFor,
  type DiscoveryCategoryMapping,
} from '@/lib/prospects/discovery-mapping'
import {
  assessProspectFit,
  shouldKeepDiscoveredProspect,
} from '@/lib/prospects/fit-score'
import {
  enrichFromWebsite,
  extractContactSignalsFromHtml,
  fetchWebsiteHtmlSafe,
} from '@/lib/prospects/enrich-website'
import {
  isMapsOrDirectoryUrl,
  normalizeWebsiteHost,
} from '@/lib/prospects/source-refs'

type BraveWebResult = {
  title?: string
  url?: string
  description?: string
}

type BraveSearchResponse = {
  web?: { results?: BraveWebResult[] }
}

export type BraveWebAdapterOptions = {
  apiKey?: string
  categorySlugs?: string[]
  city?: string
  callBudget?: number
  sitesPerQuery?: number
  fetchImpl?: typeof fetch
}

export type BraveWebFetchStats = {
  searchCalls: number
  callBudget: number
  urlsConsidered: number
  sitesFetched: number
  kept: number
  stopReason: string | null
  searchErrors: string[]
}

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search'

export function braveQueriesFor(
  mapping: DiscoveryCategoryMapping,
  city: string,
): string[] {
  const base = placesQueriesFor(mapping)
    .filter((q) => /[\u0590-\u05FF]/.test(q))
    .slice(0, 2)
  const withCity = base.map((q) => (q.includes(city) ? q : `${q} ${city}`))
  if (withCity.length === 0) {
    return [`${mapping.placesQueryHe} ${city}`]
  }
  return [...new Set(withCity)].slice(0, 2)
}

export function filterBraveResultUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    if (!raw?.trim()) continue
    if (isMapsOrDirectoryUrl(raw)) continue
    const host = normalizeWebsiteHost(raw)
    if (!host || seen.has(host)) continue
    seen.add(host)
    out.push(raw.trim())
  }
  return out
}

/**
 * Brave Search → business websites → contact/signals enrichment.
 * Coverage engine — not a ready phone list.
 */
export class BraveWebProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'brave_web'

  private readonly apiKey: string
  private readonly mappings: DiscoveryCategoryMapping[]
  private readonly city: string
  private readonly callBudget: number
  private readonly sitesPerQuery: number
  private readonly fetchImpl: typeof fetch
  lastStats: BraveWebFetchStats = {
    searchCalls: 0,
    callBudget: 0,
    urlsConsidered: 0,
    sitesFetched: 0,
    kept: 0,
    stopReason: null,
    searchErrors: [],
  }

  constructor(options: BraveWebAdapterOptions = {}) {
    const key = options.apiKey ?? process.env.BRAVE_SEARCH_API_KEY?.trim()
    if (!key) throw new Error('BRAVE_SEARCH_API_KEY is missing')
    this.apiKey = key
    this.city = options.city ?? getDiscoveryCity()
    this.callBudget = Math.max(
      1,
      options.callBudget ?? getDiscoveryBraveCallBudget(),
    )
    this.sitesPerQuery = Math.max(
      1,
      options.sitesPerQuery ?? DISCOVERY_BRAVE_SITES_PER_QUERY,
    )
    this.fetchImpl = options.fetchImpl ?? fetch
    this.mappings = getDiscoveryMappingsForSlugs(
      options.categorySlugs ?? getRecruitCategorySlugs(),
    )
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const out: ProspectSourceRecord[] = []
    const seenHosts = new Set<string>()
    const stats: BraveWebFetchStats = {
      searchCalls: 0,
      callBudget: this.callBudget,
      urlsConsidered: 0,
      sitesFetched: 0,
      kept: 0,
      stopReason: null,
      searchErrors: [],
    }

    for (const mapping of this.mappings) {
      if (stats.searchCalls >= this.callBudget) {
        stats.stopReason = 'brave_call_budget'
        break
      }
      const queries = braveQueriesFor(mapping, this.city)
      for (const query of queries) {
        if (stats.searchCalls >= this.callBudget) {
          stats.stopReason = 'brave_call_budget'
          break
        }
        let results: BraveWebResult[] = []
        try {
          results = await this.search(query)
          stats.searchCalls += 1
        } catch (e) {
          stats.searchCalls += 1
          const message = e instanceof Error ? e.message : 'Brave search failed'
          stats.searchErrors.push(`${query}: ${message}`)
          continue
        }

        const urls = filterBraveResultUrls(
          results.map((r) => r.url ?? '').filter(Boolean),
        )
        stats.urlsConsidered += urls.length

        for (const url of urls.slice(0, this.sitesPerQuery)) {
          const host = normalizeWebsiteHost(url)
          if (!host || seenHosts.has(host)) continue
          seenHosts.add(host)

          const fetched = await fetchWebsiteHtmlSafe(url, this.fetchImpl)
          if (!fetched) continue
          stats.sitesFetched += 1

          const signals = extractContactSignalsFromHtml(fetched.html)
          const phone = signals.phones[0] ?? null
          const name =
            signals.title?.replace(/\s*[|\-–].*$/, '').trim() ||
            results.find((r) => r.url === url)?.title?.trim() ||
            host

          const enrichment = await enrichFromWebsite(fetched.finalUrl, this.fetchImpl)
          const assessment = assessProspectFit({
            name,
            businessName: name,
            phone,
            websiteUrl: fetched.finalUrl,
            address: null,
          })

          if (
            !shouldKeepDiscoveredProspect({
              name,
              businessName: name,
              phone,
              websiteUrl: fetched.finalUrl,
            })
          ) {
            continue
          }

          out.push({
            name,
            businessName: name,
            phone,
            whatsappPhone:
              assessment.contactability === 'mobile' ? phone : null,
            city: this.city,
            searchCity: this.city,
            categorySlug: mapping.slug,
            sourceName: 'brave_web',
            sourceUrl: fetched.finalUrl,
            websiteUrl: fetched.finalUrl,
            externalId: `brave:${host}`,
            notes: [
              `Brave: ${query}`,
              enrichment?.businessKind
                ? `סוג עסק: ${enrichment.businessKind}`
                : null,
              `דירוג: ${assessment.score} · ${assessment.fitClass}`,
            ]
              .filter(Boolean)
              .join(' · '),
            fitScore: assessment.score,
            fitClass: assessment.fitClass,
            fitConfidence: assessment.confidence,
            fitReasons: assessment.reasons,
            contactability: assessment.contactability,
            services: enrichment?.services ?? [mapping.slug],
            queryKey: `brave:${mapping.slug}:${query}`,
            verificationStatus: 'unverified',
          })
          stats.kept += 1
        }
      }
    }

    this.lastStats = stats
    out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    return out
  }

  private async search(query: string): Promise<BraveWebResult[]> {
    const url = new URL(BRAVE_ENDPOINT)
    url.searchParams.set('q', query)
    url.searchParams.set('count', '8')
    url.searchParams.set('country', 'IL')
    url.searchParams.set('search_lang', 'he')

    const res = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Brave ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as BraveSearchResponse
    return json.web?.results ?? []
  }
}
