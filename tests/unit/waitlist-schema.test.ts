import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { waitlistSchema } from '@/lib/api/schemas'
import {
  getStoredUtm,
  hasUtm,
  readUtmFromSearchParams,
  storeUtm,
} from '@/lib/marketing/utm'

describe('waitlistSchema', () => {
  it('defaults audience to professional when omitted', () => {
    const parsed = waitlistSchema.parse({
      fullName: 'יוני לוי',
      phone: '0501234567',
    })
    assert.equal(parsed.audience, 'professional')
  })

  it('accepts customer audience for pre-launch landing', () => {
    const parsed = waitlistSchema.parse({
      fullName: 'לקוח לדוגמה',
      phone: '0527654321',
      email: 'user@example.com',
      city: 'תל אביב',
      audience: 'customer',
      source: 'prelaunch_landing',
    })
    assert.equal(parsed.audience, 'customer')
    assert.equal(parsed.source, 'prelaunch_landing')
  })

  it('accepts UTM attribution on signup', () => {
    const parsed = waitlistSchema.parse({
      fullName: 'קמפיין',
      phone: '0509998877',
      audience: 'customer',
      source: 'prelaunch_landing',
      attribution: {
        utm_source: 'meta',
        utm_medium: 'cpc',
        utm_campaign: 'prelaunch_il',
      },
    })
    assert.equal(parsed.attribution?.utm_source, 'meta')
    assert.equal(parsed.attribution?.utm_campaign, 'prelaunch_il')
  })

  it('rejects invalid audience', () => {
    assert.throws(() =>
      waitlistSchema.parse({
        fullName: 'בדיקה',
        phone: '0501111111',
        audience: 'admin',
      }),
    )
  })
})

describe('utm helpers', () => {
  it('reads UTM params from search params', () => {
    const params = new URLSearchParams(
      'utm_source=google&utm_medium=organic&utm_campaign=gsc&ref=skip',
    )
    const utm = readUtmFromSearchParams(params)
    assert.equal(utm.utm_source, 'google')
    assert.equal(utm.utm_medium, 'organic')
    assert.equal(utm.utm_campaign, 'gsc')
    assert.equal(hasUtm(utm), true)
  })

  it('persists UTM in localStorage when available', () => {
    const memory = new Map<string, string>()
    const original = globalThis.localStorage
    // @ts-expect-error test stub
    globalThis.localStorage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v)
      },
      removeItem: (k: string) => {
        memory.delete(k)
      },
    }
    // @ts-expect-error window stub for browser guard
    globalThis.window = globalThis

    storeUtm({ utm_source: 'meta', utm_medium: 'paid' })
    const stored = getStoredUtm()
    assert.equal(stored.utm_source, 'meta')
    assert.equal(stored.utm_medium, 'paid')

    globalThis.localStorage = original
  })
})
