import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { withCuratedProfessionals } from '../../lib/data/professionals-service'
import { BEAUTY_PROFESSIONALS } from '../../mock/beauty-professionals'
import type { Professional } from '../../types/professional'

const sampleDbPro: Professional = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'יוסי כהן',
  category: 'אינסטלציה',
  rating: 4.9,
  reviewCount: 10,
  startingPrice: 200,
  isAvailable: true,
  isApproved: true,
  isFeatured: true,
  completedJobs: 10,
}

describe('withCuratedProfessionals', () => {
  it('layers beauty pros onto an empty DB list', () => {
    const merged = withCuratedProfessionals([])
    assert.equal(merged.length, BEAUTY_PROFESSIONALS.length)
    assert.ok(merged.some((p) => p.category.includes('מניקור')))
    assert.ok(merged.some((p) => p.category.includes('תספורת') || p.category.includes('איפור')))
  })

  it('prepends beauty pros without duplicating DB ids', () => {
    const overlap = { ...BEAUTY_PROFESSIONALS[0]! }
    const merged = withCuratedProfessionals([sampleDbPro, overlap])
    const beautyIds = merged.filter((p) => p.id.startsWith('b')).map((p) => p.id)
    assert.equal(new Set(beautyIds).size, beautyIds.length)
    assert.ok(merged.some((p) => p.id === sampleDbPro.id))
    assert.equal(
      merged.filter((p) => p.id === overlap.id).length,
      1,
      'overlapping curated id should appear once'
    )
  })

  it('keeps DB-only list length when beauty already present', () => {
    const merged = withCuratedProfessionals([...BEAUTY_PROFESSIONALS])
    assert.equal(merged.length, BEAUTY_PROFESSIONALS.length)
  })
})
