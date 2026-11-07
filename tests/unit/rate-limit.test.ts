import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  checkMemoryRateLimit,
  clearRateLimit,
  isPhoneFailureLimited,
  peekMemoryRateLimit,
  recordRateLimitHit,
  waitlistPhoneFailureKey,
} from '../../lib/api/rate-limit'

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

  it('allows 30 waitlist IP hits and blocks the 31st (fake clock)', () => {
    const key = `unit-rl-waitlist-30-${Date.now()}-${Math.random()}`
    const t0 = 1_000_000
    for (let i = 0; i < 30; i++) {
      const result = checkMemoryRateLimit(key, 30, 60_000, t0)
      assert.equal(result.limited, false, `hit ${i + 1} should pass`)
    }
    const blocked = checkMemoryRateLimit(key, 30, 60_000, t0)
    assert.equal(blocked.limited, true)
  })
})

describe('phone failure bucket', () => {
  it('only counts failures and clears after success', async () => {
    const key = waitlistPhoneFailureKey('203.0.113.9', '050-123-4567')
    await clearRateLimit(key)

    assert.equal((await isPhoneFailureLimited(key, 3)).limited, false)
    await recordRateLimitHit(key, 3, 10 * 60_000)
    await recordRateLimitHit(key, 3, 10 * 60_000)
    await recordRateLimitHit(key, 3, 10 * 60_000)
    assert.equal((await isPhoneFailureLimited(key, 3)).limited, true)

    await clearRateLimit(key)
    assert.equal((await isPhoneFailureLimited(key, 3)).limited, false)
    assert.equal(peekMemoryRateLimit(key, 3).count, 0)
  })
})
