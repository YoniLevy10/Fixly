import { timingSafeEqual } from 'crypto'

/**
 * Verify Tranzila notification authenticity when TRANZILA_WEBHOOK_SECRET is set.
 *
 * Configure the same secret in Tranzila portal (query on notification URL or custom header)
 * and in Vercel: TRANZILA_WEBHOOK_SECRET=...
 *
 * Accepted:
 * - Authorization: Bearer <secret>
 * - Header x-tranzila-secret: <secret>
 * - Query ?secret=<secret> or ?tranzila_secret=<secret>
 * - Body field webhook_secret / secret (form or JSON)
 */
export function verifyTranzilaWebhookSecret(
  request: Request,
  body: Record<string, unknown>,
): { ok: true } | { ok: false; error: string } {
  const expected = process.env.TRANZILA_WEBHOOK_SECRET?.trim()
  if (!expected) {
    // Soft-fail for setups that have not rotated secrets yet — callers should warn in prod.
    return { ok: true }
  }

  const url = new URL(request.url)
  const auth = request.headers.get('authorization')
  const bearer =
    auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : undefined
  const headerSecret = request.headers.get('x-tranzila-secret')?.trim()
  const querySecret =
    url.searchParams.get('secret')?.trim() ||
    url.searchParams.get('tranzila_secret')?.trim() ||
    undefined
  const bodySecret =
    (typeof body.webhook_secret === 'string' && body.webhook_secret.trim()) ||
    (typeof body.secret === 'string' && body.secret.trim()) ||
    undefined

  const provided = bearer || headerSecret || querySecret || bodySecret
  if (!provided) {
    return { ok: false, error: 'missing webhook secret' }
  }

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: 'invalid webhook secret' }
  }

  return { ok: true }
}

/** True when webhook secret is required but missing from env (prod monetization warning). */
export function isTranzilaWebhookSecretConfigured(): boolean {
  return Boolean(process.env.TRANZILA_WEBHOOK_SECRET?.trim())
}
