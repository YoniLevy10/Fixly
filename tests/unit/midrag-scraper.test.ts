import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseMidragUrl,
  parseMidragDate,
  midragToFixlyRating,
} from '../../lib/integrations/midrag/scraper'

describe('parseMidragUrl', () => {
  it('parses SpCard URLs and normalizes host', () => {
    const parsed = parseMidragUrl(
      'https://midrag.co.il/SpCard/Sp/12345?areaId=1&serviceId=2&utm=x',
    )
    assert.ok(parsed)
    assert.equal(parsed!.proId, '12345')
    assert.equal(
      parsed!.fullUrl,
      'https://www.midrag.co.il/SpCard/Sp/12345?areaId=1&serviceId=2',
    )
  })

  it('rejects non-midrag URLs', () => {
    assert.equal(parseMidragUrl('https://example.com/SpCard/Sp/1'), null)
    assert.equal(parseMidragUrl('not-a-url'), null)
  })
})

describe('parseMidragDate', () => {
  it('converts DD/MM/YYYY to ISO', () => {
    assert.equal(parseMidragDate('05/08/2024'), '2024-08-05')
    assert.equal(parseMidragDate('bad'), null)
  })
})

describe('midragToFixlyRating', () => {
  it('scales 0-10 to 0-5', () => {
    assert.equal(midragToFixlyRating(9.8), 4.9)
    assert.equal(midragToFixlyRating(10), 5)
  })
})
