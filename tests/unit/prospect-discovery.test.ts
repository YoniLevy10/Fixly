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
import {
  buildDiscoveryCursor,
  sanitizeDiscoveryCursor,
} from '@/lib/prospects/discover'

function withPlacesEnabled(fn: () => void | Promise<void>) {
  return async () => {
    const prevEnabled = process.env.FIXLY_GOOGLE_PLACES_ENABLED
    const prevKey = process.env.GOOGLE_PLACES_API_KEY
    process.env.FIXLY_GOOGLE_PLACES_ENABLED = 'true'
    process.env.GOOGLE_PLACES_API_KEY = prevKey || 'test-key-for-unit'
    try {
      await fn()
    } finally {
      if (prevEnabled === undefined) delete process.env.FIXLY_GOOGLE_PLACES_ENABLED
      else process.env.FIXLY_GOOGLE_PLACES_ENABLED = prevEnabled
      if (prevKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
      else process.env.GOOGLE_PLACES_API_KEY = prevKey
    }
  }
}

describe('discovery mapping', () => {
  it('covers expanded recruit categories including home-visit beauty and tutors', () => {
    assert.ok(DISCOVERY_CATEGORY_MAP.length >= 23)
    assert.ok(DISCOVERY_CATEGORY_MAP.every((m) => m.placesQueryHe))
    const tiling = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'tiling')
    assert.ok(tiling)
    assert.ok(tiling!.placesQueriesHeExtra?.some((q) => q.includes('קרמיקה')))
    assert.ok(DISCOVERY_CATEGORY_MAP.some((m) => m.slug === 'renovations'))
    assert.ok(DISCOVERY_CATEGORY_MAP.some((m) => m.slug === 'solar'))
    assert.ok(DISCOVERY_CATEGORY_MAP.some((m) => m.slug === 'nails'))
    assert.ok(DISCOVERY_CATEGORY_MAP.some((m) => m.slug === 'hair'))
    assert.ok(DISCOVERY_CATEGORY_MAP.some((m) => m.slug === 'home_tutor'))
  })

  it('defaults per-chunk discovery budgets for continue-loop coverage', async () => {
    const {
      DISCOVERY_TOTAL_BUDGET,
      DISCOVERY_API_CALL_BUDGET,
      DISCOVERY_CHUNK_MAX_JOBS,
      getDiscoveryTotalBudget,
      getDiscoveryApiCallBudget,
      getDiscoveryChunkMaxJobs,
    } = await import('@/lib/prospects/config')
    assert.equal(DISCOVERY_TOTAL_BUDGET, 400)
    assert.equal(DISCOVERY_API_CALL_BUDGET, 40)
    assert.equal(DISCOVERY_CHUNK_MAX_JOBS, 20)
    assert.equal(getDiscoveryTotalBudget(), 400)
    assert.equal(getDiscoveryApiCallBudget(), 40)
    assert.equal(getDiscoveryChunkMaxJobs(), 20)
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

  it('explains generic source failed as save failure', () => {
    const msg = humanizeDiscoveryError('google_places: source failed')
    assert.ok(msg)
    assert.match(msg!, /שמירה|מסד/)
  })

  it('explains missing website_url column with migration hint', () => {
    const msg = humanizeDiscoveryError(
      'google_places: column professional_prospects.website_url does not exist',
    )
    assert.ok(msg)
    assert.match(msg!, /website_url|מיגרצ/)
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

describe('free-only discovery defaults', () => {
  it('defaults to OSM + gov and keeps Google off without explicit opt-in', async () => {
    const {
      getDefaultDiscoverySources,
      isGooglePlacesEnabled,
      filterDiscoverySources,
    } = await import('@/lib/prospects/config')
    const prevEnabled = process.env.FIXLY_GOOGLE_PLACES_ENABLED
    const prevKey = process.env.GOOGLE_PLACES_API_KEY
    process.env.GOOGLE_PLACES_API_KEY = 'fake-key-must-not-enable'
    delete process.env.FIXLY_GOOGLE_PLACES_ENABLED
    try {
      assert.equal(isGooglePlacesEnabled(), false)
      assert.deepEqual(getDefaultDiscoverySources(), ['osm', 'gov_pest_control'])
      assert.deepEqual(
        filterDiscoverySources(['google_places', 'osm', 'gov_pest_control']),
        ['osm', 'gov_pest_control'],
      )
      const cursor = buildDiscoveryCursor()
      assert.equal(cursor.phase, 'osm')
      assert.ok(!cursor.sourcesWanted.includes('google_places'))
    } finally {
      if (prevEnabled === undefined) delete process.env.FIXLY_GOOGLE_PLACES_ENABLED
      else process.env.FIXLY_GOOGLE_PLACES_ENABLED = prevEnabled
      if (prevKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
      else process.env.GOOGLE_PLACES_API_KEY = prevKey
    }
  })

  it('skips stuck places phase when Google is disabled', () => {
    const prevEnabled = process.env.FIXLY_GOOGLE_PLACES_ENABLED
    delete process.env.FIXLY_GOOGLE_PLACES_ENABLED
    try {
      const sanitized = sanitizeDiscoveryCursor({
        phase: 'places',
        placesJobOffset: 40,
        placesJobsTotal: 800,
        sourcesWanted: ['google_places', 'osm', 'gov_pest_control'],
        cumulative: {
          found: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: 0,
          apiCalls: 12,
        },
      })
      assert.equal(sanitized.phase, 'osm')
      assert.deepEqual(sanitized.sourcesWanted, ['osm', 'gov_pest_control'])
    } finally {
      if (prevEnabled === undefined) delete process.env.FIXLY_GOOGLE_PLACES_ENABLED
      else process.env.FIXLY_GOOGLE_PLACES_ENABLED = prevEnabled
    }
  })

  it('refuses Google adapter construction when kill switch is off even with API key', () => {
    const prevEnabled = process.env.FIXLY_GOOGLE_PLACES_ENABLED
    const prevKey = process.env.GOOGLE_PLACES_API_KEY
    process.env.GOOGLE_PLACES_API_KEY = 'present-but-disabled'
    delete process.env.FIXLY_GOOGLE_PLACES_ENABLED
    let fetchCalls = 0
    try {
      assert.throws(
        () =>
          new GooglePlacesProspectAdapter({
            apiKey: 'present-but-disabled',
            fetchImpl: async () => {
              fetchCalls += 1
              return new Response('{}', { status: 200 })
            },
          }),
        /disabled|FIXLY_GOOGLE_PLACES_ENABLED/,
      )
      assert.equal(fetchCalls, 0)
    } finally {
      if (prevEnabled === undefined) delete process.env.FIXLY_GOOGLE_PLACES_ENABLED
      else process.env.FIXLY_GOOGLE_PLACES_ENABLED = prevEnabled
      if (prevKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
      else process.env.GOOGLE_PLACES_API_KEY = prevKey
    }
  })
})

describe('GooglePlacesProspectAdapter', () => {
  it(
    'requires API key when Places is explicitly enabled',
    withPlacesEnabled(() => {
      const prev = process.env.GOOGLE_PLACES_API_KEY
      delete process.env.GOOGLE_PLACES_API_KEY
      assert.throws(
        () => new GooglePlacesProspectAdapter({ apiKey: '' }),
        /GOOGLE_PLACES_API_KEY/,
      )
      process.env.GOOGLE_PLACES_API_KEY = prev
    }),
  )

  it(
    'maps Places results with phone to prospect records',
    withPlacesEnabled(async () => {
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
                displayName: { text: 'ש.א.ל ניהול נכסים בע״מ' },
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
  }),
  )

  it(
    'supports jobOffset/maxJobs chunking without skipping unrun jobs',
    withPlacesEnabled(async () => {
    let calls = 0
    const adapter = new GooglePlacesProspectAdapter({
      apiKey: 'test-key',
      categorySlugs: ['plumbing'],
      apiCallBudget: 5,
      totalBudget: 50,
      maxJobs: 2,
      jobOffset: 0,
      searchAreas: [
        {
          labelHe: 'ירושלים',
          lat: 31.7683,
          lng: 35.2137,
          radiusMeters: 12000,
        },
      ],
      fetchImpl: async () => {
        calls += 1
        return new Response(
          JSON.stringify({
            places: [
              {
                id: `places/chunk-${calls}`,
                displayName: { text: `אינסטלטור ${calls}` },
                nationalPhoneNumber: `050-555-100${calls}`,
                types: ['plumber'],
              },
            ],
          }),
          { status: 200 },
        )
      },
    })
    await adapter.fetchRecords()
    assert.ok(adapter.lastStats.jobsTotal > 2)
    assert.equal(adapter.lastStats.jobsOffset, 0)
    assert.equal(adapter.lastStats.jobsProcessed, 2)
    assert.equal(adapter.lastStats.nextJobOffset, 2)
    assert.equal(adapter.lastStats.moreJobs, true)

    const next = new GooglePlacesProspectAdapter({
      apiKey: 'test-key',
      categorySlugs: ['plumbing'],
      apiCallBudget: 5,
      totalBudget: 50,
      maxJobs: 2,
      jobOffset: adapter.lastStats.nextJobOffset,
      searchAreas: [
        {
          labelHe: 'ירושלים',
          lat: 31.7683,
          lng: 35.2137,
          radiusMeters: 12000,
        },
      ],
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            places: [
              {
                id: 'places/chunk-next',
                displayName: { text: 'אינסטלטור המשך' },
                nationalPhoneNumber: '050-555-1099',
                types: ['plumber'],
              },
            ],
          }),
          { status: 200 },
        ),
    })
    await next.fetchRecords()
    assert.equal(next.lastStats.jobsOffset, 2)
    assert.equal(next.lastStats.nextJobOffset, 4)
  }),
  )

  it(
    'does not skip the job slice when deadline hits before any job',
    withPlacesEnabled(async () => {
    const adapter = new GooglePlacesProspectAdapter({
      apiKey: 'test-key',
      categorySlugs: ['plumbing'],
      maxJobs: 5,
      jobOffset: 3,
      deadlineAt: Date.now() - 1,
      searchAreas: [
        {
          labelHe: 'ירושלים',
          lat: 31.7683,
          lng: 35.2137,
          radiusMeters: 12000,
        },
      ],
      fetchImpl: async () => {
        throw new Error('should not call Places when deadline already passed')
      },
    })
    await adapter.fetchRecords()
    assert.equal(adapter.lastStats.jobsProcessed, 0)
    assert.equal(adapter.lastStats.nextJobOffset, 3)
    assert.equal(adapter.lastStats.moreJobs, true)
    assert.equal(adapter.lastStats.stopReason, 'wall_clock')
  }),
  )
})

describe('person-score solo filter', () => {
  it('keeps Midrag-style people and drops hard companies/shops', async () => {
    const { shouldKeepAsSoloProspect, shouldKeepDiscoveredProspect, scorePersonFit } =
      await import('@/lib/prospects/person-score')
    assert.equal(shouldKeepAsSoloProspect('יוסי כהן'), true)
    assert.equal(shouldKeepAsSoloProspect('דני אינסטלטור'), true)
    // Trade-word בע"מ (solo pro with legal entity) is kept — only chains/מוקד/retail drop
    assert.equal(shouldKeepAsSoloProspect('אינסטלציה בע״מ'), true)
    assert.equal(shouldKeepAsSoloProspect('ש.א.ל ניהול נכסים בע״מ'), false)
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
      false,
    )
  })
})
