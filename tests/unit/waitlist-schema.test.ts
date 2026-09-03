import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { waitlistSchema } from '@/lib/api/schemas'

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
