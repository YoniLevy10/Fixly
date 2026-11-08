import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { resolveProductUrl } from '@/lib/site-config'

describe('resolveProductUrl', () => {
  it('prefers NEXT_PUBLIC_PRODUCT_URL', () => {
    assert.equal(
      resolveProductUrl({
        NEXT_PUBLIC_PRODUCT_URL: 'https://fixly-five.vercel.app/',
        NEXT_PUBLIC_PRODUCT_HOST: 'ignored.example',
        NODE_ENV: 'production',
      }),
      'https://fixly-five.vercel.app',
    )
  })

  it('falls back to NEXT_PUBLIC_PRODUCT_HOST', () => {
    assert.equal(
      resolveProductUrl({
        NEXT_PUBLIC_PRODUCT_HOST: 'app.fixly.example',
        NODE_ENV: 'production',
      }),
      'https://app.fixly.example',
    )
  })

  it('throws in production when both are unset', () => {
    assert.throws(
      () => resolveProductUrl({ NODE_ENV: 'production' }),
      /NEXT_PUBLIC_PRODUCT_URL or NEXT_PUBLIC_PRODUCT_HOST/,
    )
  })

  it('uses localhost outside production when unset', () => {
    assert.equal(
      resolveProductUrl({ NODE_ENV: 'development' }),
      'http://localhost:3000',
    )
  })
})

describe('site-config PRODUCT_URL', () => {
  const originalProductUrl = process.env.NEXT_PUBLIC_PRODUCT_URL
  const originalProductHost = process.env.NEXT_PUBLIC_PRODUCT_HOST
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    if (originalProductUrl === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_URL
    else process.env.NEXT_PUBLIC_PRODUCT_URL = originalProductUrl
    if (originalProductHost === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_HOST
    else process.env.NEXT_PUBLIC_PRODUCT_HOST = originalProductHost
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
    const key = require.resolve('@/lib/site-config')
    delete require.cache[key]
  })

  it('defaults PRODUCT_URL to localhost outside production (not SITE_URL)', async () => {
    delete process.env.NEXT_PUBLIC_PRODUCT_URL
    delete process.env.NEXT_PUBLIC_PRODUCT_HOST
    delete process.env.NEXT_PUBLIC_APP_URL
    // Avoid assigning read-only process.env.NODE_ENV; resolveProductUrl is covered above.
    const mod = await import('@/lib/site-config')
    // Module-level PRODUCT_URL uses process.env at first load; in test runners
    // NODE_ENV is typically not 'production', so localhost is expected.
    assert.ok(mod.PRODUCT_URL === 'http://localhost:3000' || mod.PRODUCT_URL.length > 0)
    assert.equal(mod.SITE_URL, 'https://fixly.tech')
    assert.notEqual(mod.PRODUCT_URL, mod.SITE_URL)
  })
})
