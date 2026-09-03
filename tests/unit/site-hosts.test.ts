import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  isMarketingHost,
  isProductHost,
  normalizeHost,
  shouldShowPrelaunchLanding,
} from '@/lib/site-hosts'

describe('site-hosts', () => {
  const originalPrelaunch = process.env.NEXT_PUBLIC_FF_PRELAUNCH
  const originalProductHost = process.env.NEXT_PUBLIC_PRODUCT_HOST

  afterEach(() => {
    if (originalPrelaunch === undefined) delete process.env.NEXT_PUBLIC_FF_PRELAUNCH
    else process.env.NEXT_PUBLIC_FF_PRELAUNCH = originalPrelaunch
    if (originalProductHost === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_HOST
    else process.env.NEXT_PUBLIC_PRODUCT_HOST = originalProductHost
  })

  it('normalizes host with port and case', () => {
    assert.equal(normalizeHost('WWW.Fixly.Tech:443'), 'www.fixly.tech')
  })

  it('detects marketing vs product hosts', () => {
    assert.equal(isMarketingHost('fixly.tech'), true)
    assert.equal(isMarketingHost('www.fixly.tech'), true)
    assert.equal(isMarketingHost('fixly.vercel.app'), false)
    assert.equal(isProductHost('fixly.vercel.app'), true)
    assert.equal(isProductHost('fixly-git-main-yonilevy10s-projects.vercel.app'), true)
    assert.equal(isProductHost('localhost:3000'), true)
    assert.equal(isProductHost('fixly.tech'), false)
  })

  it('shows waitlist on fixly.tech while prelaunch is on', () => {
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'true'
    assert.equal(shouldShowPrelaunchLanding('fixly.tech'), true)
    assert.equal(shouldShowPrelaunchLanding('www.fixly.tech'), true)
  })

  it('shows marketplace on vercel.app / localhost even when prelaunch is on', () => {
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'true'
    assert.equal(shouldShowPrelaunchLanding('fixly.vercel.app'), false)
    assert.equal(shouldShowPrelaunchLanding('localhost'), false)
    assert.equal(
      shouldShowPrelaunchLanding('fixly-yonilevy10s-projects.vercel.app'),
      false,
    )
  })

  it('forces marketplace everywhere when prelaunch is false', () => {
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'false'
    assert.equal(shouldShowPrelaunchLanding('fixly.tech'), false)
    assert.equal(shouldShowPrelaunchLanding('fixly.vercel.app'), false)
  })

  it('respects NEXT_PUBLIC_PRODUCT_HOST override', () => {
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'true'
    process.env.NEXT_PUBLIC_PRODUCT_HOST = 'app.fixly.tech'
    assert.equal(isProductHost('app.fixly.tech'), true)
    assert.equal(shouldShowPrelaunchLanding('app.fixly.tech'), false)
  })
})
