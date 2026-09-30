import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SEO_WAITLIST_DEMAND_THRESHOLD } from '@/lib/seo/has-seo-value'

describe('SEO value gate', () => {
  it('requires at least 3 customer waitlist signups for demand-based index', () => {
    assert.equal(SEO_WAITLIST_DEMAND_THRESHOLD, 3)
  })
})
