import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createAdminGateToken,
  isValidAdminGateToken,
  verifyAdminPagePassword,
} from '../../lib/admin/page-gate'

describe('admin page gate', () => {
  it('rejects wrong passwords when configured', () => {
    const prev = process.env.ADMIN_PAGE_PASSWORD
    process.env.ADMIN_PAGE_PASSWORD = 'fixly-ops-test'
    try {
      assert.equal(verifyAdminPagePassword('fixly-ops-test'), true)
      assert.equal(verifyAdminPagePassword('nope'), false)
      assert.equal(verifyAdminPagePassword(''), false)
    } finally {
      if (prev === undefined) delete process.env.ADMIN_PAGE_PASSWORD
      else process.env.ADMIN_PAGE_PASSWORD = prev
    }
  })

  it('issues and validates a time-bound gate token', () => {
    const prev = process.env.ADMIN_PAGE_PASSWORD
    process.env.ADMIN_PAGE_PASSWORD = 'fixly-ops-test'
    try {
      const token = createAdminGateToken()
      assert.ok(token)
      assert.equal(isValidAdminGateToken(token), true)
      assert.equal(isValidAdminGateToken('bad.token'), false)
      assert.equal(isValidAdminGateToken(token, Date.now() + 1000 * 60 * 60 * 13), false)
    } finally {
      if (prev === undefined) delete process.env.ADMIN_PAGE_PASSWORD
      else process.env.ADMIN_PAGE_PASSWORD = prev
    }
  })
})
