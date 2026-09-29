import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MONTHLY_SIGNUP_GOAL,
  isCountableGoalSignup,
  isExcludedSignupSource,
  summarizeGoalProgress,
} from '../../lib/growth/monthly-signup-goal'

describe('monthly signup goal', () => {
  it('targets 10 signups in the next-month window', () => {
    assert.equal(MONTHLY_SIGNUP_GOAL.target, 10)
    assert.ok(MONTHLY_SIGNUP_GOAL.startIso.startsWith('2026-09-29'))
    assert.ok(MONTHLY_SIGNUP_GOAL.endIso.startsWith('2026-10-29'))
  })

  it('excludes smoke sources', () => {
    assert.equal(isExcludedSignupSource('smoke_waitlist_save'), true)
    assert.equal(isExcludedSignupSource('waitlist_landing_v5_customer'), false)
  })

  it('counts real Hebrew signup inside the window', () => {
    assert.equal(
      isCountableGoalSignup({
        full_name: 'דני כהן',
        phone: '0501234567',
        source: 'waitlist_landing_v5_customer',
        created_at: '2026-10-05T12:00:00.000Z',
      }),
      true,
    )
  })

  it('rejects spam and out-of-window rows', () => {
    assert.equal(
      isCountableGoalSignup({
        full_name: 'pedwreFzMpiwUhuDpVLq',
        phone: 'LIbsJgoQmFieDVKUV',
        source: null,
        created_at: '2026-10-05T12:00:00.000Z',
      }),
      false,
    )
    assert.equal(
      isCountableGoalSignup({
        full_name: 'דני כהן',
        phone: '0501234567',
        source: 'waitlist_landing_v5_customer',
        created_at: '2026-08-01T12:00:00.000Z',
      }),
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
