import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DISCOVERY_CATEGORY_MAP,
  ALLOWED_DISCOVERY_SOURCES,
  isAllowedDiscoverySource,
  getDiscoveryMappingsForSlugs,
  JERUSALEM_BBOX,
} from '@/lib/prospects/discovery-mapping'
import { OsmOverpassProspectAdapter } from '@/lib/prospects/adapters/osm-overpass'
import { GooglePlacesProspectAdapter } from '@/lib/prospects/adapters/google-places'

describe('discovery mapping', () => {
  it('covers ten core categories', () => {
    assert.equal(DISCOVERY_CATEGORY_MAP.length, 10)
    assert.ok(DISCOVERY_CATEGORY_MAP.every((m) => m.placesQueryHe && m.osmFilters.length))
  })

  it('filters by slug list', () => {
    const subset = getDiscoveryMappingsForSlugs(['plumbing', 'locksmith'])
    assert.equal(subset.length, 2)
    assert.equal(subset[0].slug, 'plumbing')
  })

  it('allowlists only legal sources', () => {
    assert.equal(isAllowedDiscoverySource('google_places'), true)
    assert.equal(isAllowedDiscoverySource('osm'), true)
    assert.equal(isAllowedDiscoverySource('midrag'), false)
    assert.ok(ALLOWED_DISCOVERY_SOURCES.includes('manual'))
  })

  it('defines Jerusalem bbox', () => {
    assert.ok(JERUSALEM_BBOX.north > JERUSALEM_BBOX.south)
    assert.ok(JERUSALEM_BBOX.east > JERUSALEM_BBOX.west)
  })
})

describe('OsmOverpassProspectAdapter', () => {
  it('builds overpass query with craft filters and bbox', () => {
    const adapter = new OsmOverpassProspectAdapter({
      categorySlugs: ['plumbing'],
    })
    const mapping = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'plumbing')!
    const q = adapter.buildOverpassQuery(mapping)
    assert.match(q, /craft"="plumber"/)
    assert.match(q, /31\.72/)
    assert.match(q, /out center tags/)
  })

  it('keeps only elements with phone tags', async () => {
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
                  name: 'יוסי אינסטלציה',
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
    assert.equal(records.length, 1)
    assert.equal(records[0].externalId, 'node/2')
    assert.equal(records[0].sourceName, 'osm')
    assert.equal(records[0].phone, '0501234567')
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
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            places: [
              {
                id: 'places/abc',
                displayName: { text: 'דני אינסטלטור' },
                nationalPhoneNumber: '02-555-1111',
                googleMapsUri: 'https://maps.google.com/?cid=1',
                formattedAddress: 'ירושלים',
              },
              {
                id: 'places/company',
                displayName: { text: 'שירותי אינסטלציה בע״מ' },
                nationalPhoneNumber: '02-555-2222',
              },
              {
                id: 'places/no-phone',
                displayName: { text: 'בלי טלפון' },
              },
            ],
          }),
          { status: 200 },
        ),
    })

    const records = await adapter.fetchRecords()
    assert.equal(records.length, 1)
    assert.equal(records[0].sourceName, 'google_places')
    assert.equal(records[0].externalId, 'places/abc')
    assert.equal(records[0].categorySlug, 'plumbing')
    assert.ok(records[0].phone)
  })
})

describe('person-score solo filter', () => {
  it('keeps person-shaped names and drops companies', async () => {
    const { shouldKeepAsSoloProspect, scorePersonFit } = await import(
      '@/lib/prospects/person-score'
    )
    assert.equal(shouldKeepAsSoloProspect('יוסי כהן'), true)
    assert.equal(shouldKeepAsSoloProspect('דני אינסטלטור'), true)
    assert.equal(shouldKeepAsSoloProspect('שירותי אינסטלציה בע״מ'), false)
    assert.equal(shouldKeepAsSoloProspect('חברת הובלות ארציות'), false)
    assert.ok(scorePersonFit('יוסי כהן').score >= 55)
    assert.ok(scorePersonFit('מרכז שירות מזגנים').score < 55)
  })
})
