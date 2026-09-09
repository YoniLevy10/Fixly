import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  findDuplicate,
  candidateFromSourceRecord,
} from '@/lib/prospects/dedupe'
import {
  filterBraveResultUrls,
  braveQueriesFor,
  BraveWebProspectAdapter,
} from '@/lib/prospects/adapters/brave-web'
import {
  govPestRowToRecord,
  settlementMatchesCity,
  GovPestControlProspectAdapter,
  GOV_PEST_RESOURCE_ID,
} from '@/lib/prospects/adapters/gov-pest-control'
import {
  mergeSourceRefs,
  normalizeWebsiteHost,
  pickWebsiteUrl,
  preferLicense,
} from '@/lib/prospects/source-refs'
import { DISCOVERY_CATEGORY_MAP } from '@/lib/prospects/discovery-mapping'
import { isAllowedDiscoverySource } from '@/lib/prospects/discovery-mapping'

describe('source refs + website helpers', () => {
  it('normalizes website hosts and picks non-maps URLs', () => {
    assert.equal(normalizeWebsiteHost('https://www.Example.co.il/path'), 'example.co.il')
    assert.equal(
      pickWebsiteUrl(null, 'https://maps.google.com/?cid=1'),
      null,
    )
    assert.equal(
      pickWebsiteUrl('https://shop.example.co.il', 'https://maps.google.com/?cid=1'),
      'https://shop.example.co.il',
    )
  })

  it('merges source_refs without duplicates', () => {
    const a = mergeSourceRefs([], {
      source: 'google_places',
      externalId: 'places/1',
      seenAt: '2026-01-01T00:00:00Z',
    })
    const b = mergeSourceRefs(a, {
      source: 'brave_web',
      externalId: 'brave:example.co.il',
      url: 'https://example.co.il',
      seenAt: '2026-01-02T00:00:00Z',
    })
    const c = mergeSourceRefs(b, {
      source: 'brave_web',
      externalId: 'brave:example.co.il',
      seenAt: '2026-01-03T00:00:00Z',
    })
    assert.equal(c.length, 2)
    assert.equal(c[1].seenAt, '2026-01-03T00:00:00Z')
  })

  it('prefers valid licenses', () => {
    const next = preferLicense(
      { kind: 'old', status: 'בוטל' },
      { kind: 'מדביר בדירות', status: 'בתוקף', number: '123' },
    )
    assert.equal(next?.number, '123')
  })
})

describe('dedupe website_domain', () => {
  it('matches on website host across sources', () => {
    const existing = [
      {
        id: 'p1',
        phoneNormalized: null,
        sourceName: 'google_places',
        externalId: 'places/x',
        businessName: 'דני',
        categoryId: 'cat',
        city: 'ירושלים',
        websiteHost: 'dani-plumb.co.il',
      },
    ]
    const hit = findDuplicate(
      candidateFromSourceRecord(
        {
          name: 'דני אינסטלטור',
          city: 'ירושלים',
          sourceName: 'brave_web',
          websiteUrl: 'https://www.dani-plumb.co.il/contact',
          externalId: 'brave:dani-plumb.co.il',
        },
        'cat',
      ),
      existing,
    )
    assert.ok(hit)
    assert.equal(hit!.reason, 'website_domain')
    assert.equal(hit!.existingId, 'p1')
  })
})

describe('brave web adapter helpers', () => {
  it('allowlists brave_web and builds Hebrew city queries', () => {
    assert.equal(isAllowedDiscoverySource('brave_web'), true)
    assert.equal(isAllowedDiscoverySource('gov_pest_control'), true)
    const plumbing = DISCOVERY_CATEGORY_MAP.find((m) => m.slug === 'plumbing')!
    const qs = braveQueriesFor(plumbing, 'ירושלים')
    assert.ok(qs.length >= 1)
    assert.ok(qs.every((q) => q.includes('ירושלים')))
  })

  it('filters directory and social URLs', () => {
    const urls = filterBraveResultUrls([
      'https://b144.co.il/foo',
      'https://facebook.com/x',
      'https://maps.google.com/?cid=1',
      'https://my-plumber.co.il/',
      'https://www.my-plumber.co.il/about',
    ])
    assert.deepEqual(urls, ['https://my-plumber.co.il/'])
  })

  it('discovers a prospect from mocked Brave + site HTML', async () => {
    const adapter = new BraveWebProspectAdapter({
      apiKey: 'test',
      categorySlugs: ['plumbing'],
      city: 'ירושלים',
      callBudget: 2,
      sitesPerQuery: 1,
      fetchImpl: async (input) => {
        const url = String(input)
        if (url.includes('api.search.brave.com')) {
          return new Response(
            JSON.stringify({
              web: {
                results: [
                  {
                    title: 'יוסי אינסטלטור ירושלים',
                    url: 'https://yossi-plumb.example/',
                  },
                ],
              },
            }),
            { status: 200 },
          )
        }
        return new Response(
          `<html><title>יוסי אינסטלטור</title><body>אינסטלציה עד הבית 050-1234567</body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } },
        )
      },
    })
    const records = await adapter.fetchRecords()
    assert.ok(records.length >= 1)
    assert.equal(records[0].sourceName, 'brave_web')
    assert.ok(records[0].externalId?.startsWith('brave:'))
    assert.ok(records[0].phone?.includes('050'))
  })
})

describe('gov pest control adapter', () => {
  it('keeps the documented resource id', () => {
    assert.equal(GOV_PEST_RESOURCE_ID, '4941fd97-9f9f-4e45-b117-9f71735e9845')
  })

  it('filters Jerusalem settlements', () => {
    assert.equal(settlementMatchesCity('ירושלים', 'ירושלים'), true)
    assert.equal(settlementMatchesCity('מבשרת ציון', 'ירושלים'), true)
    assert.equal(settlementMatchesCity('חיפה', 'ירושלים'), false)
  })

  it('maps registry rows to prospect records with license', () => {
    const rec = govPestRowToRecord(
      {
        LicenseNumber: 999,
        FirstName: 'דוד',
        LastName: 'כהן',
        settlement: 'ירושלים',
        Telephone: '052-1112233',
        LicenseType: 'מדביר בדירות',
        Status: 'בתוקף',
        PermitExpirationDate: '01/01/2030',
      },
      'ירושלים',
    )
    assert.ok(rec)
    assert.equal(rec!.categorySlug, 'pest_control')
    assert.equal(rec!.sourceName, 'gov_pest_control')
    assert.equal(rec!.license?.number, '999')
    assert.equal(rec!.externalId, 'gov:pest:999')
  })

  it('loads injected rows without network', async () => {
    const adapter = new GovPestControlProspectAdapter({
      city: 'ירושלים',
      rows: [
        {
          LicenseNumber: 1,
          FirstName: 'א',
          LastName: 'ב',
          settlement: 'תל אביב',
          Telephone: '050-0000000',
          LicenseType: 'מדביר בדירות',
          Status: 'בתוקף',
        },
        {
          LicenseNumber: 2,
          FirstName: 'משה',
          LastName: 'לוי',
          settlement: 'ירושלים',
          Telephone: '050-9998877',
          LicenseType: 'מדביר במבנים ובשטח פתוח',
          Status: 'בתוקף',
        },
      ],
    })
    const records = await adapter.fetchRecords()
    assert.equal(records.length, 1)
    assert.equal(records[0].name, 'משה לוי')
  })
})
