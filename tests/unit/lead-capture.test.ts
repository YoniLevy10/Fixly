import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { looksLikeSpamWaitlist } from '../../lib/waitlist/spam-guard'
import { isAnalyticsHostAllowed } from '../../lib/analytics/allowed-host'
import { isSeedDemoProfessionalId } from '../../lib/data/seed-professionals'
import { DEFAULT_TITLE_HE, WAITLIST_TITLE_HE } from '../../lib/site-config'

describe('spam-guard', () => {
  it('accepts normal Hebrew customer signup', () => {
    assert.equal(
      looksLikeSpamWaitlist({
        fullName: 'יוני לוי',
        phone: '0501234567',
        city: 'תל אביב',
      }),
      null,
    )
  })

  it('rejects gibberish name + non-phone like Sep spam rows', () => {
    assert.ok(
      looksLikeSpamWaitlist({
        fullName: 'pedwreFzMpiwUhuDpVLq',
        phone: 'LIbsJgoQmFieDVKUV',
        city: 'gxPRWxvLSiRSLBtrP',
        category: 'rBqUrBxZnhEUpArAEu',
      }),
    )
  })

  it('rejects invalid Israeli phone digits', () => {
    assert.ok(
      looksLikeSpamWaitlist({
        fullName: 'דני כהן',
        phone: '12345',
      }),
    )
  })
})

describe('analytics host allowlist', () => {
  it('allows fixly.tech only', () => {
    assert.equal(isAnalyticsHostAllowed('fixly.tech'), true)
    assert.equal(isAnalyticsHostAllowed('www.fixly.tech'), true)
    assert.equal(isAnalyticsHostAllowed('localhost'), false)
    assert.equal(isAnalyticsHostAllowed('127.0.0.1'), false)
    assert.equal(isAnalyticsHostAllowed('fixly.vercel.app'), false)
    assert.equal(
      isAnalyticsHostAllowed('fixly-git-main-yonilevy10s-projects.vercel.app'),
      false,
    )
  })
})

describe('seed demo professionals', () => {
  it('flags the four production seed UUIDs', () => {
    assert.equal(
      isSeedDemoProfessionalId('10000000-0000-4000-8000-000000000001'),
      true,
    )
    assert.equal(
      isSeedDemoProfessionalId('10000000-0000-4000-8000-000000000004'),
      true,
    )
    assert.equal(
      isSeedDemoProfessionalId('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
      false,
    )
  })
})

describe('site copy split', () => {
  it('keeps marketplace title free of early-access framing', () => {
    assert.match(DEFAULT_TITLE_HE, /תיקונים/)
    assert.doesNotMatch(DEFAULT_TITLE_HE, /הרשמה מוקדמת/)
    assert.match(WAITLIST_TITLE_HE, /הרשמה/)
  })
})
