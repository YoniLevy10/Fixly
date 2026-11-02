import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'

describe('site-config PRODUCT_URL', () => {
  const originalProductUrl = process.env.NEXT_PUBLIC_PRODUCT_URL
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    if (originalProductUrl === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_URL
    else process.env.NEXT_PUBLIC_PRODUCT_URL = originalProductUrl
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
    // Clear module cache so env re-reads apply
    const key = require.resolve('@/lib/site-config')
    delete require.cache[key]
  })

  it('defaults PRODUCT_URL to fixly.vercel.app (not SITE_URL)', async () => {
    delete process.env.NEXT_PUBLIC_PRODUCT_URL
    delete process.env.NEXT_PUBLIC_APP_URL
    const mod = await import('@/lib/site-config')
    assert.equal(mod.PRODUCT_URL, 'https://fixly.vercel.app')
    assert.equal(mod.SITE_URL, 'https://fixly.tech')
    assert.notEqual(mod.PRODUCT_URL, mod.SITE_URL)
  })
})
