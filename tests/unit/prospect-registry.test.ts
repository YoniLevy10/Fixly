import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  findDuplicate,
  candidateFromSourceRecord,
} from '@/lib/prospects/dedupe'
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
      source: 'gov_pest_control',
      externalId: 'gov:pest:9',
      seenAt: '2026-01-02T00:00:00Z',
    })
    const c = mergeSourceRefs(b, {
      source: 'gov_pest_control',
      externalId: 'gov:pest:9',
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
          sourceName: 'osm',
          websiteUrl: 'https://www.dani-plumb.co.il/contact',
          externalId: 'node/1',
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

describe('gov pest control adapter', () => {
  it('allowlists free registry source only', () => {
    assert.equal(isAllowedDiscoverySource('gov_pest_control'), true)
    assert.equal(isAllowedDiscoverySource('brave_web'), false)
  })

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
