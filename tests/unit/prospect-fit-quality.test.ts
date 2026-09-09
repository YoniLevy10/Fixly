import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assessProspectFit,
  shouldKeepAsSoloProspect,
  shouldKeepDiscoveredProspect,
} from '@/lib/prospects/fit-score'
import { selectJobsForBudget, computeYieldScore } from '@/lib/prospects/query-queue'
import { __enrichTest } from '@/lib/prospects/enrich-website'
import {
  DISCOVERY_CATEGORY_MAP,
  getCityGeoProfile,
  placesQueriesFor,
  placesSearchJobsFor,
  JERUSALEM_SEARCH_AREAS,
} from '@/lib/prospects/discovery-mapping'
import { GooglePlacesProspectAdapter } from '@/lib/prospects/adapters/google-places'
import { OsmOverpassProspectAdapter } from '@/lib/prospects/adapters/osm-overpass'
import {
  humanizeDiscoveryError,
  humanizeDiscoveryErrors,
} from '@/lib/prospects/humanize-discovery-error'

describe('fit-score quality', () => {
  it('does not auto-reject solo with soft commercial words', () => {
    const a = assessProspectFit({
      name: 'שירותי אינסטלציה יוסי',
      phone: '0501234567',
    })
    assert.notEqual(a.fitClass, 'unsuitable')
    assert.ok(shouldKeepDiscoveredProspect({ name: 'שירותי אינסטלציה יוסי', phone: '0501234567' }))
    assert.ok(
      shouldKeepDiscoveredProspect({
        name: 'התקנות מזגנים דני',
        phone: '0521112233',
      }),
    )
  })

  it('rejects building-materials retail even with craft word', () => {
    const a = assessProspectFit({
      name: 'חנות טובול חומרי בניין',
      phone: '0509998877',
    })
    assert.equal(a.fitClass, 'unsuitable')
    assert.equal(
      shouldKeepDiscoveredProspect({
        name: 'חנות טובול חומרי בניין',
        phone: '0509998877',
      }),
      false,
    )
  })

  it('accepts Arabic and English person-shaped names', () => {
    const ar = assessProspectFit({
      name: 'أحمد السباك',
      phone: '0502223344',
    })
    assert.notEqual(ar.fitClass, 'unsuitable')
    const en = assessProspectFit({
      name: 'David Cohen Plumber',
      phone: '0502223344',
    })
    assert.notEqual(en.fitClass, 'unsuitable')
    assert.ok(shouldKeepAsSoloProspect('David Cohen'))
  })

  it('identical name and businessName does not change score vs single name', () => {
    const once = assessProspectFit({ name: 'יוסי כהן אינסטלטור' })
    const twice = assessProspectFit({
      name: 'יוסי כהן אינסטלטור',
      businessName: 'יוסי כהן אינסטלטור',
    })
    assert.equal(once.score, twice.score)
    assert.deepEqual(once.reasons, twice.reasons)
  })

  it('landline does not block professional fit keep', () => {
    assert.equal(
      shouldKeepDiscoveredProspect({
        name: 'יוסי כהן אינסטלטור',
        phone: '02-555-1111',
      }),
      true,
    )
    const a = assessProspectFit({
      name: 'יוסי כהן אינסטלטור',
      phone: '02-555-1111',
    })
    assert.equal(a.contactability, 'landline')
    assert.notEqual(a.fitClass, 'unsuitable')
  })

  it('missing evidence stays unknown/needs_review not unsuitable', () => {
    const a = assessProspectFit({ name: 'עסק כללי' })
    assert.notEqual(a.fitClass, 'unsuitable')
  })
})

describe('query queue + geo', () => {
  it('includes HE/AR/EN queries and neighborhood jobs', () => {
    const plumbing = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'plumbing')!
    const qs = placesQueriesFor(plumbing)
    assert.ok(qs.some((q) => q.includes('שרברב')))
    assert.ok(qs.some((q) => /plumber/i.test(q)))
    assert.ok(qs.some((q) => q.includes('سباك')))
    const jobs = placesSearchJobsFor(plumbing, 'ירושלים')
    assert.ok(jobs.some((j) => j.textQuery.includes('גילה')))
    assert.ok(JERUSALEM_SEARCH_AREAS.length >= 8)
  })

  it('changing city changes geo profile away from Jerusalem bbox', () => {
    const j = getCityGeoProfile('ירושלים')
    process.env.FIXLY_RECRUIT_CITY_LAT = '32.08'
    process.env.FIXLY_RECRUIT_CITY_LNG = '34.78'
    process.env.FIXLY_RECRUIT_CITY_RADIUS_M = '10000'
    const t = getCityGeoProfile('תל אביב')
    delete process.env.FIXLY_RECRUIT_CITY_LAT
    delete process.env.FIXLY_RECRUIT_CITY_LNG
    delete process.env.FIXLY_RECRUIT_CITY_RADIUS_M
    assert.notEqual(t.bbox.north, j.bbox.north)
    assert.ok(Math.abs(t.center.lat - 32.08) < 0.01)
  })

  it('selectJobsForBudget respects call budget and prefers yield', () => {
    const plumbing = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'plumbing')!
    const jobs = placesSearchJobsFor(plumbing, 'ירושלים').slice(0, 20)
    const selected = selectJobsForBudget(
      jobs,
      [
        {
          query_key: jobs[0].queryKey,
          yield_score: 0.9,
          last_run_at: new Date().toISOString(),
          raw_count: 10,
        },
      ],
      5,
    )
    assert.ok(selected.length <= 5)
    assert.ok(selected.length > 0)
    assert.ok(computeYieldScore({ raw: 10, uniqueNew: 4, suitable: 3, needsReview: 1 }) > 0)
  })
})

describe('Places pagination + budget', () => {
  it('paginates with pageToken and stops on api call budget without dupes', async () => {
    let calls = 0
    const adapter = new GooglePlacesProspectAdapter({
      apiKey: 'test',
      categorySlugs: ['plumbing'],
      apiCallBudget: 2,
      totalBudget: 100,
      searchAreas: [
        {
          labelHe: 'ירושלים',
          lat: 31.77,
          lng: 35.21,
          radiusMeters: 12000,
        },
      ],
      queryStats: [],
      fetchImpl: async (_url, init) => {
        calls += 1
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          pageToken?: string
          includePureServiceAreaBusinesses?: boolean
        }
        assert.equal(body.includePureServiceAreaBusinesses, true)
        if (!body.pageToken) {
          return new Response(
            JSON.stringify({
              places: [
                {
                  id: 'places/a',
                  displayName: { text: 'דני אינסטלטור' },
                  nationalPhoneNumber: '050-111-2222',
                  types: ['plumber'],
                  pureServiceAreaBusiness: true,
                },
              ],
              nextPageToken: 'TOKEN2',
            }),
            { status: 200 },
          )
        }
        return new Response(
          JSON.stringify({
            places: [
              {
                id: 'places/a',
                displayName: { text: 'דני אינסטלטור' },
                nationalPhoneNumber: '050-111-2222',
              },
              {
                id: 'places/b',
                displayName: { text: 'אבי שרברב' },
                nationalPhoneNumber: '050-333-4444',
                types: ['plumber'],
              },
            ],
          }),
          { status: 200 },
        )
      },
    })

    const records = await adapter.fetchRecords()
    assert.ok(adapter.lastStats.searchCalls <= 2)
    const ids = records.map((r) => r.externalId)
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(records.some((r) => r.externalId === 'places/a'))
  })
})

describe('OSM city bbox', () => {
  it('uses city geo profile bbox in overpass query', () => {
    process.env.FIXLY_RECRUIT_CITY_LAT = '32.08'
    process.env.FIXLY_RECRUIT_CITY_LNG = '34.78'
    const adapter = new OsmOverpassProspectAdapter({
      city: 'תל אביב',
      categorySlugs: ['plumbing'],
    })
    const mapping = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'plumbing')!
    const q = adapter.buildOverpassQuery(mapping)
    delete process.env.FIXLY_RECRUIT_CITY_LAT
    delete process.env.FIXLY_RECRUIT_CITY_LNG
    assert.match(q, /34\.6|34\.7|34\.8/)
    assert.doesNotMatch(q, /31\.72,35\.14,31\.87,35\.28/)
  })
})

describe('enrichment SSRF', () => {
  it('blocks private hosts', () => {
    assert.equal(__enrichTest.isBlockedUrl('http://127.0.0.1/x'), true)
    assert.equal(__enrichTest.isBlockedUrl('http://169.254.169.254/latest'), true)
    assert.equal(__enrichTest.isBlockedUrl('https://example.com'), false)
  })
})

describe('humanizeDiscoveryError', () => {
  it('explains Overpass failures', () => {
    const msg = humanizeDiscoveryError('osm: Overpass query failed (504)')
    assert.ok(msg && /OpenStreetMap|Overpass/.test(msg))
    assert.equal(humanizeDiscoveryErrors([msg, msg, null]).length, 1)
  })
})

describe('discovery config defaults', () => {
  it('exposes api call budget', async () => {
    const { getDiscoveryApiCallBudget, DISCOVERY_TOTAL_BUDGET } = await import(
      '@/lib/prospects/config'
    )
    assert.equal(DISCOVERY_TOTAL_BUDGET, 1200)
    assert.ok(getDiscoveryApiCallBudget() >= 40)
  })
})
