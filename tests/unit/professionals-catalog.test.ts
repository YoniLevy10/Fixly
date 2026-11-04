import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { withCuratedProfessionals } from '../../lib/data/professionals-service'
import { PROFESSIONALS_PUBLIC_SELECT } from '../../lib/data/supabase-professionals'
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
  it('returns empty list unchanged (no beauty overlay)', () => {
    const merged = withCuratedProfessionals([])
    assert.equal(merged.length, 0)
  })

  it('passes through DB professionals without injecting extras', () => {
    const input = [sampleDbPro]
    const merged = withCuratedProfessionals(input)
    assert.equal(merged.length, 1)
    assert.equal(merged[0]?.id, sampleDbPro.id)
    assert.equal(merged, input)
  })
})

describe('PROFESSIONALS_PUBLIC_SELECT', () => {
  it('does not request columns missing from production professionals', () => {
    const sql = PROFESSIONALS_PUBLIC_SELECT
    for (const missing of [
      'midrag_profile_url',
      'midrag_rating',
      'midrag_reviews_count',
      'midrag_verified',
      'midrag_last_synced_at',
      'updated_at',
    ]) {
      assert.equal(sql.includes(missing), false, missing)
    }
    assert.match(sql, /\bperformance_score\b/)
    assert.match(sql, /service_categories/)
  })
})
