import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { acceptedWaitlistSave } from '@/lib/marketing/signup-result'

const SAVED_ID = '11111111-2222-4333-8444-555555555555'

describe('acceptedWaitlistSave', () => {
  it('accepts only a successful response that includes the saved row id', () => {
    assert.equal(acceptedWaitlistSave(true, { id: SAVED_ID }), true)
  })

  it('rejects a failed save even if an id is present', () => {
    assert.equal(acceptedWaitlistSave(false, { id: SAVED_ID }), false)
  })

  it('rejects a successful response that did not return an id', () => {
    assert.equal(acceptedWaitlistSave(true, {}), false)
    assert.equal(acceptedWaitlistSave(true, null), false)
    assert.equal(acceptedWaitlistSave(true, { id: 'not-a-row' }), false)
  })
})
