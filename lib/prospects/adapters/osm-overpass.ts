import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  JERUSALEM_BBOX,
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  type DiscoveryCategoryMapping,
} from '@/lib/prospects/discovery-mapping'
import { getRecruitCategorySlugs } from '@/lib/prospects/config'
import {
  scorePersonFit,
  shouldKeepDiscoveredProspect,
} from '@/lib/prospects/person-score'

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

/**
 * Legal discovery via OpenStreetMap Overpass API (ODbL).
 * No API key. Phone coverage is sparse — only records with phone are kept.
 */
export class OsmOverpassProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'osm'

  private readonly mappings: DiscoveryCategoryMapping[]
  private readonly city: string
  private readonly perCategoryLimit: number
  private readonly endpoint: string
  private readonly fetchImpl: typeof fetch

  constructor(options: OsmAdapterOptions = {}) {
    this.city = options.city ?? getDiscoveryCity()
    this.perCategoryLimit = Math.min(options.perCategoryLimit ?? 40, 80)
    this.endpoint = options.endpoint ?? DEFAULT_OVERPASS
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
        const phone = (tags.phone || tags['contact:phone'] || tags.mobile || '').trim()
        if (!phone) continue

        const name =
          tags.name?.trim() ||
          tags['name:he']?.trim() ||
          tags.operator?.trim() ||
          mapping.placesQueryHe

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
        const sourceUrl = tags.website || tags['contact:website'] || null

        out.push({
          name,
          businessName: name,
          phone,
          whatsappPhone: phone,
          city: this.city,
          categorySlug: mapping.slug,
          sourceName: 'osm',
          sourceUrl,
          externalId,
          notes: [
            tags['addr:street'] ? `רחוב: ${tags['addr:street']}` : null,
            'מקור: OpenStreetMap (ODbL)',
            `דירוג התאמה: ${fit.score} (${fit.kind}) · נייד`,
          ]
            .filter(Boolean)
            .join(' · '),
          fitScore: fit.score,
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

  /** Partial Overpass failures (per category) from the last fetch. */
  lastCategoryErrors: string[] = []

  buildOverpassQuery(mapping: DiscoveryCategoryMapping): string {
    const { south, west, north, east } = JERUSALEM_BBOX
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
    const res = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `Overpass query failed (${res.status}): ${body.slice(0, 300)}`,
      )
    }

    const json = (await res.json()) as OverpassResponse
    return json.elements ?? []
  }
}
