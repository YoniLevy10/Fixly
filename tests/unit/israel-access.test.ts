import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  decideIsraelAccess,
  isGeoBypassPath,
  isIsraelOnlyGateEnabled,
  isSearchCrawler,
  resolveRequestCountry,
} from '@/lib/geo/israel-access'

describe('israel-access', () => {
  it('resolves country from Vercel header first', () => {
    const headers = new Headers({ 'x-vercel-ip-country': 'il' })
    assert.equal(resolveRequestCountry(headers, 'US'), 'IL')
  })

  it('falls back to geo country', () => {
    assert.equal(resolveRequestCountry(new Headers(), 'de'), 'DE')
    assert.equal(resolveRequestCountry(new Headers(), null), null)
  })

  it('detects major search crawlers', () => {
    assert.equal(isSearchCrawler('Mozilla/5.0 (compatible; Googlebot/2.1)'), true)
    assert.equal(isSearchCrawler('bingbot/2.0'), true)
    assert.equal(isSearchCrawler('Mozilla/5.0 (iPhone) Safari'), false)
  })

  it('bypasses cron, webhooks, health, and SEO paths', () => {
    assert.equal(isGeoBypassPath('/api/cron/discover-prospects'), true)
    assert.equal(isGeoBypassPath('/api/tranzila/webhook'), true)
    assert.equal(isGeoBypassPath('/api/v1/jobs'), true)
    assert.equal(isGeoBypassPath('/api/health'), true)
    assert.equal(isGeoBypassPath('/il-only'), true)
    assert.equal(isGeoBypassPath('/robots.txt'), true)
    assert.equal(isGeoBypassPath('/'), false)
    assert.equal(isGeoBypassPath('/request/new'), false)
  })

  it('allows IL and blocks other countries when gate is on', () => {
    assert.equal(
      decideIsraelAccess({
        enabled: true,
        country: 'IL',
        userAgent: 'Mozilla/5.0',
        pathname: '/',
      }),
      'allow',
    )
    assert.equal(
      decideIsraelAccess({
        enabled: true,
        country: 'US',
        userAgent: 'Mozilla/5.0',
        pathname: '/',
      }),
      'block',
    )
  })

  it('allows crawlers and unknown country', () => {
    assert.equal(
      decideIsraelAccess({
        enabled: true,
        country: 'US',
        userAgent: 'Googlebot/2.1',
        pathname: '/',
      }),
      'allow',
    )
    assert.equal(
      decideIsraelAccess({
        enabled: true,
        country: null,
        userAgent: 'Mozilla/5.0',
        pathname: '/',
      }),
      'allow',
    )
  })

  it('allows localhost even for non-IL country header', () => {
    assert.equal(
      decideIsraelAccess({
        enabled: true,
        country: 'US',
        userAgent: 'Mozilla/5.0',
        pathname: '/',
        host: 'localhost:3000',
      }),
      'allow',
    )
  })

  it('respects explicit FF off', () => {
    const prev = process.env.NEXT_PUBLIC_FF_ISRAEL_ONLY
    process.env.NEXT_PUBLIC_FF_ISRAEL_ONLY = 'false'
    assert.equal(isIsraelOnlyGateEnabled(), false)
    if (prev === undefined) delete process.env.NEXT_PUBLIC_FF_ISRAEL_ONLY
    else process.env.NEXT_PUBLIC_FF_ISRAEL_ONLY = prev
  })
})
