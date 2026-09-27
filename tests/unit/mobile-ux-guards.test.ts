import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  getIdempotentResponse,
  setIdempotentResponse,
} from '../../lib/api/idempotency'
import {
  newIdempotencyKey,
  resolveDestinationCoords,
} from '../../lib/ux/submit-guards'

describe('request idempotency cache', () => {
  beforeEach(() => {
    // overwrite with fresh keys each test — Map is process-global
  })

  it('returns the same cached body for a repeated key', () => {
    const key = `test-${Date.now()}`
    const body = { id: 'req-1', title: 'ברז' }
    setIdempotentResponse(key, body, 201)
    const hit = getIdempotentResponse(key)
    assert.ok(hit)
    assert.equal(hit.status, 201)
    assert.deepEqual(hit.body, body)
  })

  it('misses unknown keys', () => {
    assert.equal(getIdempotentResponse('missing-key-xyz'), null)
  })
})

describe('submit guards', () => {
  it('generates unique idempotency keys', () => {
    const a = newIdempotencyKey()
    const b = newIdempotencyKey()
    assert.notEqual(a, b)
    assert.ok(a.length >= 8)
  })

  it('prefers prefetched coords over live/fallback', async () => {
    const result = await resolveDestinationCoords({
      prefetched: { lat: 32.1, lng: 34.8, at: Date.now() },
      locationText: 'חיפה',
      timeoutMs: 50,
      coordsFromLocationText: () => ({ lat: 0, lng: 0 }),
    })
    assert.equal(result.source, 'prefetch')
    assert.equal(result.lat, 32.1)
    assert.equal(result.lng, 34.8)
  })

  it('falls back to location text when geo unavailable', async () => {
    const result = await resolveDestinationCoords({
      prefetched: null,
      locationText: 'תל אביב',
      timeoutMs: 10,
      coordsFromLocationText: () => ({ lat: 32.08, lng: 34.78 }),
    })
    assert.equal(result.source, 'fallback')
    assert.equal(result.lat, 32.08)
  })
})
