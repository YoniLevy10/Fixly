import crypto from 'crypto'

const DEFAULT_TOLERANCE_SEC = 300

export type StripeWebhookVerifyResult =
  | { ok: true; event: Record<string, unknown> }
  | { ok: false; error: string }

/**
 * Verify Stripe webhook signature without the Stripe SDK.
 * @see https://docs.stripe.com/webhooks/signatures
 */
export function verifyStripeWebhook(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSec = DEFAULT_TOLERANCE_SEC,
): StripeWebhookVerifyResult {
  const parts = signatureHeader.split(',').map((p) => p.trim())
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2)
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3))

  if (!timestamp || signatures.length === 0) {
    return { ok: false, error: 'invalid signature header' }
  }

  const age = Math.floor(Date.now() / 1000) - Number(timestamp)
  if (!Number.isFinite(age) || age > toleranceSec) {
    return { ok: false, error: 'timestamp outside tolerance window' }
  }

  const signedPayload = `${timestamp}.${payload}`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  const valid = signatures.some((sig) => {
    if (sig.length !== expected.length) return false
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    } catch {
      return false
    }
  })

  if (!valid) {
    return { ok: false, error: 'signature mismatch' }
  }

  try {
    const event = JSON.parse(payload) as Record<string, unknown>
    return { ok: true, event }
  } catch {
    return { ok: false, error: 'Invalid JSON payload' }
  }
}
