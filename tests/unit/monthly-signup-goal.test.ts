import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MONTHLY_SIGNUP_GOAL,
  getMonthlyGoalWindow,
  isCountableGoalSignup,
  isExcludedSignupSource,
  summarizeGoalProgress,
} from '../../lib/growth/monthly-signup-goal'

describe('monthly signup goal', () => {
  it('uses a rolling 30-day window relative to now', () => {
    assert.equal(MONTHLY_SIGNUP_GOAL.target, 10)
    assert.equal(MONTHLY_SIGNUP_GOAL.windowDays, 30)
    const now = new Date('2026-11-07T12:00:00.000Z')
    const { start, end } = getMonthlyGoalWindow(now)
    assert.equal(end.toISOString(), now.toISOString())
    assert.equal(
      start.toISOString(),
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    )
  })

  it('excludes smoke sources', () => {
    assert.equal(isExcludedSignupSource('smoke_waitlist_save'), true)
    assert.equal(isExcludedSignupSource('waitlist_landing_v5_customer'), false)
  })

  it('counts a row created today and rejects one 31 days old', () => {
    const now = new Date('2026-11-07T12:00:00.000Z')
    assert.equal(
      isCountableGoalSignup(
        {
          full_name: 'דני כהן',
          phone: '0501234567',
          source: 'waitlist_landing_v5_professional',
          created_at: '2026-11-07T10:00:00.000Z',
        },
        now,
      ),
      true,
    )
    assert.equal(
      isCountableGoalSignup(
        {
          full_name: 'דני כהן',
          phone: '0501234567',
          source: 'waitlist_landing_v5_professional',
          created_at: '2026-10-06T12:00:00.000Z',
        },
        now,
      ),
      false,
    )
  })

  it('rejects spam rows inside the window', () => {
    const now = new Date('2026-11-07T12:00:00.000Z')
    assert.equal(
      isCountableGoalSignup(
        {
          full_name: 'pedwreFzMpiwUhuDpVLq',
          phone: 'LIbsJgoQmFieDVKUV',
          source: null,
          created_at: '2026-11-05T12:00:00.000Z',
        },
        now,
      ),
      false,
    )
  })

  it('summarizes remaining toward 10', () => {
    const mid = summarizeGoalProgress(3)
    assert.equal(mid.remaining, 7)
    assert.equal(mid.pct, 30)
    assert.equal(mid.hit, false)
    assert.equal(summarizeGoalProgress(10).hit, true)
  })
})
