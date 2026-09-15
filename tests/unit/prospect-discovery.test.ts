import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DISCOVERY_CATEGORY_MAP,
  ALLOWED_DISCOVERY_SOURCES,
  isAllowedDiscoverySource,
  getDiscoveryMappingsForSlugs,
  placesQueriesFor,
  placesSearchJobsFor,
  JERUSALEM_BBOX,
  JERUSALEM_SEARCH_AREAS,
} from '@/lib/prospects/discovery-mapping'
import { OsmOverpassProspectAdapter } from '@/lib/prospects/adapters/osm-overpass'
import { GooglePlacesProspectAdapter } from '@/lib/prospects/adapters/google-places'
import {
  humanizeDiscoveryError,
  humanizeDiscoveryErrors,
} from '@/lib/prospects/humanize-discovery-error'

describe('discovery mapping', () => {
  it('covers expanded recruit categories including ceramics/tiling trades', () => {
    assert.ok(DISCOVERY_CATEGORY_MAP.length >= 19)
    assert.ok(DISCOVERY_CATEGORY_MAP.every((m) => m.placesQueryHe))
    const tiling = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'tiling')
    assert.ok(tiling)
    assert.ok(tiling!.placesQueriesHeExtra?.some((q) => q.includes('קרמיקה')))
    assert.ok(DISCOVERY_CATEGORY_MAP.some((m) => m.slug === 'renovations'))
    assert.ok(DISCOVERY_CATEGORY_MAP.some((m) => m.slug === 'solar'))
  })

  it('defaults discovery budget to 1200 for neighborhood coverage', async () => {
    const { DISCOVERY_TOTAL_BUDGET, getDiscoveryTotalBudget } = await import(
      '@/lib/prospects/config'
    )
    assert.equal(DISCOVERY_TOTAL_BUDGET, 1200)
    assert.equal(getDiscoveryTotalBudget(), 1200)
  })

  it('includes English/Arabic Places queries and Jerusalem neighborhood jobs', () => {
    assert.ok(JERUSALEM_SEARCH_AREAS.length >= 8)
    const plumbing = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'plumbing')!
    const queries = placesQueriesFor(plumbing)
    assert.ok(queries.some((q) => /plumber/i.test(q)))
    assert.ok(queries.some((q) => q.includes('سباك')))
    const jobs = placesSearchJobsFor(plumbing, 'ירושלים')
    assert.ok(jobs.some((j) => j.textQuery.includes('פסגת זאב')))
    assert.ok(jobs.some((j) => j.area.labelHe === 'גילה'))
    const cityJobs = jobs.filter((j) => j.area.labelHe === 'ירושלים')
    const neighborhoodJobs = jobs.filter((j) => j.area.labelHe === 'פסגת זאב')
    assert.ok(cityJobs.length > neighborhoodJobs.length)
  })

  it('filters by slug list', () => {
    const subset = getDiscoveryMappingsForSlugs(['plumbing', 'locksmith'])
    assert.equal(subset.length, 2)
    assert.equal(subset[0].slug, 'plumbing')
  })

  it('allowlists only legal sources', () => {
    assert.equal(isAllowedDiscoverySource('google_places'), true)
    assert.equal(isAllowedDiscoverySource('osm'), true)
    assert.equal(isAllowedDiscoverySource('gov_pest_control'), true)
    assert.equal(isAllowedDiscoverySource('brave_web'), false)
    assert.equal(isAllowedDiscoverySource('midrag'), false)
    assert.ok(ALLOWED_DISCOVERY_SOURCES.includes('manual'))
  })

  it('defines Jerusalem bbox', () => {
    assert.ok(JERUSALEM_BBOX.north > JERUSALEM_BBOX.south)
    assert.ok(JERUSALEM_BBOX.east > JERUSALEM_BBOX.west)
  })
})

describe('humanizeDiscoveryError', () => {
  it('explains Overpass/OSM failures instead of vague partial', () => {
    const msg = humanizeDiscoveryError(
      'osm: plumbing: Overpass query failed (504): Gateway Timeout',
    )
    assert.ok(msg)
    assert.match(msg!, /OpenStreetMap|Overpass/)
    assert.ok(!msg!.includes('הייתה תקלה חלקית בזמן הגילוי'))
  })

  it('dedupes humanized errors', () => {
    const list = humanizeDiscoveryErrors([
      'Overpass query failed (502)',
      'osm: tiling: Overpass query failed (504)',
      null,
    ])
    assert.equal(list.length, 1)
  })

  it('explains PostgREST category embed ambiguity (0 created bug)', () => {
    const msg = humanizeDiscoveryError(
      "google_places: Could not embed because more than one relationship was found for 'professional_prospects' and 'service_categories'",
    )
    assert.ok(msg)
    assert.match(msg!, /שמירה|קטגוריה/)
    assert.ok(!msg!.startsWith('תקלה חלקית:'))
  })
})

describe('OsmOverpassProspectAdapter', () => {
  it('builds overpass query with craft filters and bbox', () => {
    const adapter = new OsmOverpassProspectAdapter({
      categorySlugs: ['plumbing'],
      city: 'ירושלים',
    })
    const mapping = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'plumbing')!
    const q = adapter.buildOverpassQuery(mapping)
    assert.match(q, /craft"="plumber"/)
    assert.match(q, /31\.72/)
    assert.match(q, /out center tags/)
  })

  it('keeps only elements with phone tags that pass fit', async () => {
    const adapter = new OsmOverpassProspectAdapter({
      categorySlugs: ['plumbing'],
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            elements: [
              {
                type: 'node',
                id: 1,
                tags: { name: 'בלי טלפון', craft: 'plumber' },
              },
              {
                type: 'node',
                id: 2,
                tags: {
                  name: 'יוסי כהן אינסטלטור',
                  phone: '0501234567',
                  craft: 'plumber',
                },
              },
            ],
          }),
          { status: 200 },
        ),
    })

    const records = await adapter.fetchRecords()
    assert.ok(records.length >= 1)
    assert.equal(records[0].sourceName, 'osm')
  })

  it('continues other categories when one Overpass call fails', async () => {
    let calls = 0
    const adapter = new OsmOverpassProspectAdapter({
      categorySlugs: ['plumbing', 'electricity'],
      // Fail first category across all Overpass mirrors, then succeed
      fetchImpl: async () => {
        calls += 1
        if (calls <= 3) {
          return new Response('Gateway Timeout', { status: 504 })
        }
        return new Response(
          JSON.stringify({
            elements: [
              {
                type: 'node',
                id: 9,
                tags: {
                  name: 'אבי חשמלאי',
                  phone: '0509998877',
                  craft: 'electrician',
                },
              },
            ],
          }),
          { status: 200 },
        )
      },
    })
    const records = await adapter.fetchRecords()
    assert.equal(records.length, 1)
    assert.ok(adapter.lastCategoryErrors.length >= 1)
  })

  it('retries the next Overpass mirror after a 504', async () => {
    const hits: string[] = []
    const adapter = new OsmOverpassProspectAdapter({
      categorySlugs: ['plumbing'],
      fetchImpl: async (url) => {
        hits.push(String(url))
        if (hits.length === 1) {
          return new Response('Gateway Timeout', { status: 504 })
        }
        return new Response(
          JSON.stringify({
            elements: [
              {
                type: 'node',
                id: 3,
                tags: {
                  name: 'דוד אינסטלטור',
                  phone: '0501112233',
                  craft: 'plumber',
                },
              },
            ],
          }),
          { status: 200 },
        )
      },
    })
    const records = await adapter.fetchRecords()
    assert.ok(records.length >= 1)
    assert.ok(hits.length >= 2)
  })
})

describe('prospect category embed', () => {
  it('disambiguates service_categories FK for PostgREST', async () => {
    const { PROSPECT_CATEGORY_EMBED } = await import('@/lib/prospects/service')
    assert.match(
      PROSPECT_CATEGORY_EMBED,
      /service_categories!professional_prospects_category_id_fkey/,
    )
  })
})

describe('GooglePlacesProspectAdapter', () => {
  it('requires API key', () => {
    const prev = process.env.GOOGLE_PLACES_API_KEY
    delete process.env.GOOGLE_PLACES_API_KEY
    assert.throws(() => new GooglePlacesProspectAdapter({ apiKey: '' }), /GOOGLE_PLACES_API_KEY/)
    process.env.GOOGLE_PLACES_API_KEY = prev
  })

  it('maps Places results with phone to prospect records', async () => {
    const adapter = new GooglePlacesProspectAdapter({
      apiKey: 'test-key',
      categorySlugs: ['plumbing'],
      apiCallBudget: 20,
      totalBudget: 200,
      searchAreas: [
        {
          labelHe: 'ירושלים',
          lat: 31.7683,
          lng: 35.2137,
          radiusMeters: 12000,
        },
      ],
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          includePureServiceAreaBusinesses?: boolean
        }
        assert.equal(body.includePureServiceAreaBusinesses, true)
        return new Response(
          JSON.stringify({
            places: [
              {
                id: 'places/abc',
                displayName: { text: 'דני אינסטלטור' },
                nationalPhoneNumber: '050-555-1111',
                googleMapsUri: 'https://maps.google.com/?cid=1',
                formattedAddress: 'ירושלים',
                types: ['plumber'],
                pureServiceAreaBusiness: true,
              },
              {
                id: 'places/company',
                displayName: { text: 'אינסטלציה בע״מ' },
                nationalPhoneNumber: '02-555-2222',
              },
            ],
          }),
          { status: 200 },
        )
      },
    })

    const records = await adapter.fetchRecords()
    assert.ok(
      records.some((r) => r.externalId === 'places/abc'),
      `expected places/abc in ${records.map((r) => r.externalId).join(',')}`,
    )
    assert.ok(!records.some((r) => r.externalId === 'places/company'))
    assert.ok(adapter.lastStats.searchCalls >= 1)
  })
})

describe('person-score solo filter', () => {
  it('keeps Midrag-style people and drops hard companies/shops', async () => {
    const { shouldKeepAsSoloProspect, shouldKeepDiscoveredProspect, scorePersonFit } =
      await import('@/lib/prospects/person-score')
    assert.equal(shouldKeepAsSoloProspect('יוסי כהן'), true)
    assert.equal(shouldKeepAsSoloProspect('דני אינסטלטור'), true)
    assert.equal(shouldKeepAsSoloProspect('אינסטלציה בע״מ'), false)
    assert.equal(shouldKeepAsSoloProspect('חנות טובול חומרי בניין'), false)
    assert.ok(scorePersonFit('יוסי כהן').score >= 50)

    assert.equal(
      shouldKeepDiscoveredProspect({
        name: 'דני אינסטלטור',
        phone: '050-123-4567',
      }),
      true,
    )
    assert.equal(
      shouldKeepDiscoveredProspect({
        name: 'דני אינסטלטור',
        phone: '02-555-1111',
      }),
      true,
    )
  })
})
