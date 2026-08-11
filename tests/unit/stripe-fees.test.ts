import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeJobPlatformFee } from '../../lib/stripe/job-checkout'
import { computeCommissionAgorot } from '../../lib/monetization/config'

describe('computeJobPlatformFee', () => {
  it('returns commission in ILS (not agorot)', () => {
    assert.equal(computeJobPlatformFee(100), 10)
    assert.equal(computeJobPlatformFee(250), 25)
    assert.equal(computeJobPlatformFee(0), 0)
  })

  it('matches agorot commission / 100', () => {
    const amount = 333
    assert.equal(computeJobPlatformFee(amount), computeCommissionAgorot(amount) / 100)
  })
})
