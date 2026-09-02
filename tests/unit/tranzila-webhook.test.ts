import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { verifyTranzilaWebhookSecret } from '@/lib/tranzila/verify-webhook'

describe('verifyTranzilaWebhookSecret', () => {
  const prev = process.env.TRANZILA_WEBHOOK_SECRET

  beforeEach(() => {
    process.env.TRANZILA_WEBHOOK_SECRET = 'unit-test-secret'
  })

  afterEach(() => {
    if (prev === undefined) delete process.env.TRANZILA_WEBHOOK_SECRET
    else process.env.TRANZILA_WEBHOOK_SECRET = prev
  })

  it('accepts bearer token', () => {
    const req = new Request('https://x/api/tranzila/webhook', {
      headers: { Authorization: 'Bearer unit-test-secret' },
    })
    assert.equal(verifyTranzilaWebhookSecret(req, {}).ok, true)
  })

  it('accepts query secret', () => {
    const req = new Request('https://x/api/tranzila/webhook?secret=unit-test-secret')
    assert.equal(verifyTranzilaWebhookSecret(req, {}).ok, true)
  })

  it('rejects wrong secret', () => {
    const req = new Request('https://x/api/tranzila/webhook', {
      headers: { 'x-tranzila-secret': 'nope' },
    })
    const result = verifyTranzilaWebhookSecret(req, {})
    assert.equal(result.ok, false)
  })

  it('soft-allows when env secret unset', () => {
    delete process.env.TRANZILA_WEBHOOK_SECRET
    const req = new Request('https://x/api/tranzila/webhook')
    assert.equal(verifyTranzilaWebhookSecret(req, {}).ok, true)
  })
})
