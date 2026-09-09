import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import {
  JERUSALEM_BBOX,
  getDiscoveryCity,
  getDiscoveryMappingsForSlugs,
  type DiscoveryCategoryMapping,
} from '@/lib/prospects/discovery-mapping'
import { getRecruitCategorySlugs } from '@/lib/prospects/config'

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
    this.perCategoryLimit = Math.min(options.perCategoryLimit ?? 25, 50)
    this.endpoint = options.endpoint ?? DEFAULT_OVERPASS
    this.fetchImpl = options.fetchImpl ?? fetch
    this.mappings = getDiscoveryMappingsForSlugs(
      options.categorySlugs ?? getRecruitCategorySlugs(),
    )
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const out: ProspectSourceRecord[] = []
    const seen = new Set<string>()

    for (const mapping of this.mappings) {
      const elements = await this.queryCategory(mapping)
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
          ]
            .filter(Boolean)
            .join(' · '),
          verificationStatus: 'unverified',
        })
      }
    }

    return out
  }

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
