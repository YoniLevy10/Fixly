import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  getCityGeoProfile,
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  type DiscoveryCategoryMapping,
} from '@/lib/prospects/discovery-mapping'
import { getRecruitCategorySlugs } from '@/lib/prospects/config'
import {
  assessProspectFit,
  shouldKeepDiscoveredProspect,
} from '@/lib/prospects/fit-score'

type OsmElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type OverpassResponse = {
  elements?: OsmElement[]
}

export type OsmAdapterOptions = {
  categorySlugs?: string[]
  city?: string
  perCategoryLimit?: number
  totalBudget?: number
  endpoint?: string
  fetchImpl?: typeof fetch
}

const DEFAULT_OVERPASS = 'https://overpass-api.de/api/interpreter'

/** Public Overpass mirrors — try next on timeout / 5xx / rate limit. */
const OVERPASS_ENDPOINTS = [
  DEFAULT_OVERPASS,
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const

/**
 * Legal discovery via OpenStreetMap Overpass API (ODbL).
 * Bbox follows recruit city geo profile (not hardcoded Jerusalem when city changes).
 */
export class OsmOverpassProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'osm'

  private readonly mappings: DiscoveryCategoryMapping[]
  private readonly city: string
  private readonly perCategoryLimit: number
  private readonly endpoints: string[]
  private readonly fetchImpl: typeof fetch
  lastCategoryErrors: string[] = []

  constructor(options: OsmAdapterOptions = {}) {
    this.city = options.city ?? getDiscoveryCity()
    this.perCategoryLimit = Math.min(options.perCategoryLimit ?? 40, 80)
    this.endpoints = options.endpoint
      ? [options.endpoint, ...OVERPASS_ENDPOINTS.filter((e) => e !== options.endpoint)]
      : [...OVERPASS_ENDPOINTS]
    this.fetchImpl = options.fetchImpl ?? fetch
    this.mappings = getDiscoveryMappingsForSlugs(
      options.categorySlugs ?? getRecruitCategorySlugs(),
    )
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const out: ProspectSourceRecord[] = []
    const seen = new Set<string>()
    const categoryErrors: string[] = []

    for (const mapping of this.mappings) {
      if (mapping.osmFilters.length === 0) continue
      let elements: OsmElement[] = []
      try {
        elements = await this.queryCategory(mapping)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Overpass failed'
        categoryErrors.push(`${mapping.slug}: ${message}`)
        continue
      }
      for (const el of elements.slice(0, this.perCategoryLimit)) {
        const externalId = `${el.type}/${el.id}`
        if (seen.has(externalId)) continue
        seen.add(externalId)

        const tags = el.tags ?? {}
        const phone = (
          tags.phone ||
          tags['contact:phone'] ||
          tags.mobile ||
          ''
        ).trim()

        const name =
          tags.name?.trim() ||
          tags['name:he']?.trim() ||
          tags['name:ar']?.trim() ||
          tags['name:en']?.trim() ||
          tags.operator?.trim() ||
          mapping.placesQueryHe

        const website = tags.website || tags['contact:website'] || null
        const address = tags['addr:street']
          ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}`
          : null

        const assessment = assessProspectFit({
          name,
          businessName: name,
          phone: phone || null,
          websiteUrl: website,
          address,
        })

        if (
          !shouldKeepDiscoveredProspect({
            name,
            businessName: name,
            phone: phone || null,
            websiteUrl: website,
            address,
          })
        ) {
          continue
        }

        out.push({
          name,
          businessName: name,
          phone: phone || null,
          whatsappPhone:
            assessment.contactability === 'mobile' ? phone || null : null,
          city: this.city,
          searchCity: this.city,
          businessAddress: address,
          categorySlug: mapping.slug,
          sourceName: 'osm',
          sourceUrl: website,
          externalId,
          notes: [
            address ? `רחוב: ${address}` : null,
            'מקור: OpenStreetMap (ODbL)',
            `דירוג: ${assessment.score} · ${assessment.fitClass} · קשר: ${assessment.contactability}`,
          ]
            .filter(Boolean)
            .join(' · '),
          fitScore: assessment.score,
          fitClass: assessment.fitClass,
          fitConfidence: assessment.confidence,
          fitReasons: assessment.reasons,
          contactability: assessment.contactability,
          verificationStatus: 'unverified',
        })
      }
    }

    this.lastCategoryErrors = categoryErrors
    if (categoryErrors.length > 0 && out.length === 0) {
      throw new Error(
        `Overpass query failed for all categories: ${categoryErrors[0]}`,
      )
    }

    out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    return out
  }

  buildOverpassQuery(mapping: DiscoveryCategoryMapping): string {
    const { south, west, north, east } = getCityGeoProfile(this.city).bbox
    const bbox = `${south},${west},${north},${east}`
    const parts = mapping.osmFilters.flatMap((filter) => {
      const [k, v] = filter.split('=')
      if (!k || !v) return []
      return [
        `node["${k}"="${v}"](${bbox});`,
        `way["${k}"="${v}"](${bbox});`,
      ]
    })

    return `
[out:json][timeout:25];
(
  ${parts.join('\n  ')}
);
out center tags;
`.trim()
  }

  private async queryCategory(
    mapping: DiscoveryCategoryMapping,
  ): Promise<OsmElement[]> {
    const query = this.buildOverpassQuery(mapping)
    const body = `data=${encodeURIComponent(query)}`
    const errors: string[] = []

    for (const endpoint of this.endpoints) {
      try {
        const res = await this.fetchImpl(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(35_000),
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          const err = `Overpass query failed (${res.status}): ${text.slice(0, 200)}`
          // Retry other mirrors on rate limit / gateway errors
          if ([429, 502, 503, 504, 509].includes(res.status)) {
            errors.push(`${endpoint}: ${err}`)
            continue
          }
          throw new Error(err)
        }

        const json = (await res.json()) as OverpassResponse
        return json.elements ?? []
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Overpass failed'
        errors.push(`${endpoint}: ${message}`)
        // Network / timeout → try next mirror
        continue
      }
    }

    throw new Error(
      `Overpass query failed for all mirrors: ${errors[0] ?? 'unknown'}`,
    )
  }
}
