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
  it('requires audience — no silent professional default', () => {
    assert.throws(() =>
      waitlistSchema.parse({
        fullName: 'יוני לוי',
        phone: '0501234567',
      }),
    )
  })

  it('accepts customer audience for public landing', () => {
    const parsed = waitlistSchema.parse({
      fullName: 'לקוח לדוגמה',
      phone: '0527654321',
      email: 'user@example.com',
      city: 'תל אביב',
      audience: 'customer',
      source: 'waitlist_landing_v5_customer',
    })
    assert.equal(parsed.audience, 'customer')
    assert.equal(parsed.source, 'waitlist_landing_v5_customer')
  })

  it('requires at least one profession for professionals', () => {
    assert.throws(() =>
      waitlistSchema.parse({
        fullName: 'בעל מקצוע',
        phone: '0501112233',
        audience: 'professional',
      }),
    )
  })

  it('accepts multi-select categories for professionals', () => {
    const parsed = waitlistSchema.parse({
      fullName: 'בעל מקצוע',
      phone: '0501112233',
      audience: 'professional',
      categories: ['חשמלאים', 'טכנאי מזגנים'],
      source: 'waitlist_landing_v5_professional',
    })
    assert.deepEqual(parsed.categories, ['חשמלאים', 'טכנאי מזגנים'])
  })

  it('accepts UTM attribution on signup', () => {
    const parsed = waitlistSchema.parse({
      fullName: 'קמפיין',
      phone: '0509998877',
      audience: 'customer',
      source: 'waitlist_landing_v5_customer',
      attribution: {
        utm_source: 'meta',
        utm_medium: 'paid',
        utm_campaign: 'prelaunch_il',
      },
    })
    assert.equal(parsed.attribution?.utm_source, 'meta')
    assert.equal(parsed.attribution?.utm_medium, 'paid')
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
