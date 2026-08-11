import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  monetizationConfig,
  agorotToIls,
  computeCommissionAgorot,
} from '../../lib/monetization/config'

describe('monetizationConfig', () => {
  it('exposes pilot pricing defaults', () => {
    assert.equal(monetizationConfig.currency, 'ils')
    assert.equal(monetizationConfig.freeLeadCreditsPerMonth, 3)
    assert.equal(monetizationConfig.leadFeeAgorot, 1500)
    assert.equal(monetizationConfig.proSubscriptionAgorot, 14900)
    assert.equal(monetizationConfig.commissionBasisPoints, 1000)
  })

  it('defines free and pro tiers', () => {
    assert.equal(monetizationConfig.tiers.free.maxLeadsPerMonth, 3)
    assert.equal(monetizationConfig.tiers.pro.maxLeadsPerMonth, null)
    assert.equal(monetizationConfig.tiers.pro.featured, true)
  })
})

describe('agorotToIls', () => {
  it('converts agorot to ILS', () => {
    assert.equal(agorotToIls(1500), 15)
    assert.equal(agorotToIls(14900), 149)
    assert.equal(agorotToIls(0), 0)
  })
})

describe('computeCommissionAgorot', () => {
  it('applies 10% commission in agorot', () => {
    assert.equal(computeCommissionAgorot(100), 1000)
    assert.equal(computeCommissionAgorot(250), 2500)
    assert.equal(computeCommissionAgorot(0), 0)
  })
})
