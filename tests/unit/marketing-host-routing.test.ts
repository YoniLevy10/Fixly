import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isLegacyVercelProductionHost,
  isMarketingHost,
  isMarketingPublicPath,
  isProductHost,
  shouldShowPrelaunchLanding,
} from '@/lib/site-hosts'

/**
 * Documents middleware host separation:
 * - marketing host + non-allowlisted path → 308 /waitlist (same host)
 * - legacy vercel production hosts stay product (no bounce to fixly.tech)
 */
describe('marketing host routing policy', () => {
  it('does not treat legacy vercel production as marketing', () => {
    assert.equal(isMarketingHost('fixly.vercel.app'), false)
    assert.equal(isLegacyVercelProductionHost('fixly.vercel.app'), true)
    assert.equal(isProductHost('fixly.vercel.app'), true)
    assert.equal(shouldShowPrelaunchLanding('fixly.vercel.app'), false)
  })

  it('redirects product paths off marketing hosts (allowlist miss)', () => {
    assert.equal(isMarketingHost('fixly.tech'), true)
    assert.equal(isMarketingPublicPath('/professionals'), false)
    // Middleware maps this miss → 308 Location: /waitlist on same host
  })

  it('keeps landing paths on marketing hosts', () => {
    assert.equal(isMarketingPublicPath('/'), true)
    assert.equal(isMarketingPublicPath('/waitlist'), true)
    assert.equal(isMarketingPublicPath('/for-professionals'), true)
    assert.equal(shouldShowPrelaunchLanding('fixly.tech'), true)
  })

  it('preview git vercel hosts remain full product', () => {
    const preview = 'fixly-git-feat-abc-team.vercel.app'
    assert.equal(isLegacyVercelProductionHost(preview), false)
    assert.equal(isProductHost(preview), true)
    assert.equal(shouldShowPrelaunchLanding(preview), false)
  })
})
