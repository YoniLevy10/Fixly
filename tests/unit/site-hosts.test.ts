import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  isIndexablePublicHost,
  isLegacyVercelProductionHost,
  isMarketingHost,
  isMarketingPublicPath,
  isProductHost,
  normalizeHost,
  normalizePathname,
  shouldShowPrelaunchLanding,
} from '@/lib/site-hosts'

describe('site-hosts', () => {
  const originalPrelaunch = process.env.NEXT_PUBLIC_FF_PRELAUNCH
  const originalProductHost = process.env.NEXT_PUBLIC_PRODUCT_HOST
  const originalDemoKill = process.env.NEXT_PUBLIC_FF_DEMO_KILL
  const originalDemoData = process.env.NEXT_PUBLIC_FF_DEMO_DATA

  afterEach(() => {
    if (originalPrelaunch === undefined) delete process.env.NEXT_PUBLIC_FF_PRELAUNCH
    else process.env.NEXT_PUBLIC_FF_PRELAUNCH = originalPrelaunch
    if (originalProductHost === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_HOST
    else process.env.NEXT_PUBLIC_PRODUCT_HOST = originalProductHost
    if (originalDemoKill === undefined) delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
    else process.env.NEXT_PUBLIC_FF_DEMO_KILL = originalDemoKill
    if (originalDemoData === undefined) delete process.env.NEXT_PUBLIC_FF_DEMO_DATA
    else process.env.NEXT_PUBLIC_FF_DEMO_DATA = originalDemoData
  })

  it('normalizes host with port and case', () => {
    assert.equal(normalizeHost('WWW.Fixly.Tech:443'), 'www.fixly.tech')
  })

  it('normalizes trailing slash on pathnames', () => {
    assert.equal(normalizePathname('/waitlist/'), '/waitlist')
    assert.equal(normalizePathname('/'), '/')
  })

  it('detects marketing vs product hosts', () => {
    assert.equal(isMarketingHost('fixly.tech'), true)
    assert.equal(isMarketingHost('www.fixly.tech'), true)
    assert.equal(isMarketingHost('fixly.vercel.app'), false)
    assert.equal(isIndexablePublicHost('fixly.tech'), true)
    assert.equal(isIndexablePublicHost('www.fixly.tech'), true)
    assert.equal(isIndexablePublicHost('fixly.vercel.app'), false)
    assert.equal(isIndexablePublicHost('localhost'), false)
    // Marketing hosts are registration-only — not product UI hosts
    assert.equal(isProductHost('fixly.tech'), false)
    assert.equal(isProductHost('www.fixly.tech'), false)
    assert.equal(isProductHost('fixly.vercel.app'), true)
    assert.equal(isProductHost('fixly-git-main-yonilevy10s-projects.vercel.app'), true)
    assert.equal(isProductHost('localhost:3000'), true)
    assert.equal(isLegacyVercelProductionHost('fixly-five.vercel.app'), true)
    assert.equal(isLegacyVercelProductionHost('fixly-git-main.vercel.app'), false)
  })

  it('allowlists only marketing/landing paths on the purchased domain', () => {
    for (const path of [
      '/',
      '/waitlist',
      '/waitlist/',
      '/pro/join',
      '/privacy',
      '/terms',
      '/about',
      '/for-professionals',
      '/il-only',
      '/api/waitlist',
      '/api/pro/waitlist',
      '/robots.txt',
      '/sitemap.xml',
      '/manifest.webmanifest',
    ]) {
      assert.equal(isMarketingPublicPath(path), true, path)
    }
    for (const path of [
      '/professionals',
      '/professional/abc',
      '/services/jerusalem/plumber',
      '/login',
      '/my-requests',
      '/pro/dashboard',
      '/request/new',
      '/categories',
      '/api/health',
      '/go',
    ]) {
      assert.equal(isMarketingPublicPath(path), false, path)
    }
  })

  it('keeps waitlist on fixly.tech even while demo mode is on', () => {
    delete process.env.NEXT_PUBLIC_FF_DEMO_KILL
    process.env.NEXT_PUBLIC_FF_DEMO_DATA = 'true'
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'true'
    assert.equal(shouldShowPrelaunchLanding('fixly.tech'), true)
    assert.equal(shouldShowPrelaunchLanding('www.fixly.tech'), true)
  })

  it('shows waitlist on fixly.tech when demo is killed and prelaunch is on', () => {
    process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'true'
    assert.equal(shouldShowPrelaunchLanding('fixly.tech'), true)
    assert.equal(shouldShowPrelaunchLanding('www.fixly.tech'), true)
  })

  it('shows marketplace on vercel.app / localhost even when prelaunch is on', () => {
    process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'true'
    assert.equal(shouldShowPrelaunchLanding('fixly.vercel.app'), false)
    assert.equal(shouldShowPrelaunchLanding('localhost'), false)
    assert.equal(
      shouldShowPrelaunchLanding('fixly-yonilevy10s-projects.vercel.app'),
      false,
    )
  })

  it('keeps marketing hosts on waitlist even when prelaunch is false', () => {
    process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'false'
    assert.equal(shouldShowPrelaunchLanding('fixly.tech'), true)
    assert.equal(shouldShowPrelaunchLanding('fixly.vercel.app'), false)
  })

  it('defaults to waitlist on marketing hosts when prelaunch env is unset', () => {
    process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
    delete process.env.NEXT_PUBLIC_FF_PRELAUNCH
    assert.equal(shouldShowPrelaunchLanding('fixly.tech'), true)
    assert.equal(shouldShowPrelaunchLanding('localhost'), false)
  })

  it('respects NEXT_PUBLIC_PRODUCT_HOST override', () => {
    process.env.NEXT_PUBLIC_FF_DEMO_KILL = 'true'
    process.env.NEXT_PUBLIC_FF_PRELAUNCH = 'true'
    process.env.NEXT_PUBLIC_PRODUCT_HOST = 'app.fixly.tech'
    assert.equal(isProductHost('app.fixly.tech'), true)
    assert.equal(shouldShowPrelaunchLanding('app.fixly.tech'), false)
  })
})
