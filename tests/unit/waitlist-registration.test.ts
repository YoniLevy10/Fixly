import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sanitizeAnalyticsProps } from '../../lib/analytics/track'
import { publicAttribution } from '../../lib/marketing/utm'
import { jerusalemDayStart } from '../../lib/time/jerusalem-day'
import { waitlistPhoneLookupFilter } from '../../lib/waitlist/phone-lookup'

describe('waitlist phone lookup', () => {
  it('builds a filter that covers dashed and international mobiles', () => {
    const filter = waitlistPhoneLookupFilter('050-123-4567')
    assert.ok(filter)
    assert.match(filter, /phone\.ilike\.%050%123%4567%/)
    assert.match(filter, /phone\.ilike\.%972%50%123%4567%/)
    assert.match(filter, /phone\.eq\.0501234567/)
    assert.match(filter, /phone\.eq\.972501234567/)
  })
})

describe('analytics privacy', () => {
  it('drops contact fields and values that look like a phone or email', () => {
    assert.deepEqual(
      sanitizeAnalyticsProps({
        audience: 'professional',
        id: '11111111-2222-4333-8444-555555555555',
        phone: '0501234567',
        email: 'pro@example.com',
        fullName: 'דנה כהן',
        city: 'ירושלים',
        message: 'הטלפון 0501234567 כבר קיים',
        utm_source: 'google',
      }),
      { audience: 'professional', utm_source: 'google' },
    )
  })

  it('publishes source, medium, and campaign only', () => {
    assert.deepEqual(
      publicAttribution({
        utm_source: 'internal_test',
        utm_medium: 'qa',
        utm_campaign: 'pro_funnel_20261104',
        utm_term: 'שם פרטי',
        utm_content: '0501234567',
      }),
      {
        utm_source: 'internal_test',
        utm_medium: 'qa',
        utm_campaign: 'pro_funnel_20261104',
      },
    )
  })
})

describe('jerusalem day start', () => {
  it('uses the Israel calendar day, including after midnight local time', () => {
    const afternoon = jerusalemDayStart(new Date('2026-11-04T12:00:00.000Z'))
    const afterMidnight = jerusalemDayStart(new Date('2026-11-03T22:30:00.000Z'))
    assert.equal(afternoon.toISOString(), '2026-11-03T22:00:00.000Z')
    assert.equal(afterMidnight.toISOString(), '2026-11-03T22:00:00.000Z')
  })
})
