import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkMemoryRateLimit } from '../../lib/api/rate-limit'

describe('checkMemoryRateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `unit-rl-allow-${Date.now()}-${Math.random()}`
    const first = checkMemoryRateLimit(key, 3, 60_000)
    assert.equal(first.limited, false)
    assert.equal(first.remaining, 2)

    const second = checkMemoryRateLimit(key, 3, 60_000)
    assert.equal(second.limited, false)
    assert.equal(second.remaining, 1)
  })

  it('marks limited after exceeding the limit', () => {
    const key = `unit-rl-block-${Date.now()}-${Math.random()}`
    checkMemoryRateLimit(key, 2, 60_000)
    checkMemoryRateLimit(key, 2, 60_000)
    const third = checkMemoryRateLimit(key, 2, 60_000)
    assert.equal(third.limited, true)
    assert.equal(third.remaining, 0)
  })
})
