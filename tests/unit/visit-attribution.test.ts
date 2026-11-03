import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { inferVisitAttribution } from '@/lib/marketing/utm'

describe('inferVisitAttribution', () => {
  it('keeps an existing campaign instead of replacing it', () => {
    assert.equal(
      inferVisitAttribution({
        referrer: 'https://www.google.com/search?q=fixly',
        pathname: '/',
        existing: { utm_source: 'meta', utm_medium: 'paid' },
      }),
      null,
    )
  })

  it('records a Google landing as organic with the path', () => {
    assert.deepEqual(
      inferVisitAttribution({
        referrer: 'https://www.google.co.il/search?q=%D7%9C%D7%99%D7%93%D7%99%D7%9D',
        pathname: '/for-professionals',
        existing: {},
      }),
      { utm_source: 'google', utm_medium: 'organic', utm_campaign: '/for-professionals' },
    )
  })

  it('records a visit with no referrer as direct', () => {
    assert.deepEqual(
      inferVisitAttribution({ referrer: '', pathname: '/', existing: {} }),
      { utm_source: 'direct', utm_medium: 'none', utm_campaign: '/' },
    )
  })

  it('does not overwrite the first touch when the next page is on Fixly', () => {
    assert.equal(
      inferVisitAttribution({
        referrer: 'https://fixly.tech/for-professionals',
        pathname: '/waitlist',
        existing: {},
      }),
      null,
    )
  })
})
