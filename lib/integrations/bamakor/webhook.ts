import { createHmac, timingSafeEqual } from 'crypto'
import type { WebhookPayload } from './types'

export function getWebhookSecret(): string | null {
  return process.env.BAMAKOR_WEBHOOK_SECRET?.trim() || null
}

export function signWebhookBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex')
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false
  const expected = signWebhookBody(body, secret)
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature.replace(/^sha256=/i, ''), 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export type EmitWebhookResult = {
  delivered: boolean
  httpStatus: number | null
  error: string | null
  payload: WebhookPayload
  /** When no callback URL — payload is returned for logging / smoke tests */
  dryRun: boolean
  attempts: number
}

const DEFAULT_MAX_ATTEMPTS = 3
/** Backoff before attempt 2 and 3 (ms). Attempt 1 is immediate. */
const DEFAULT_BACKOFF_MS = [0, 500, 2000] as const

function sleep(ms: number, sleepImpl?: (ms: number) => Promise<void>) {
  if (sleepImpl) return sleepImpl(ms)
  if (ms <= 0) return Promise.resolve()
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/**
 * Emit signed status webhook to Bamakor.
 * Retries up to 3 times with backoff (0ms → 500ms → 2000ms).
 * Logs when callback_url missing or FIXLY_WEBHOOK_DRY_RUN=1 (no HTTP).
 *
 * Expected Bamakor path (not implemented in Bamakor by this workstream):
 *   POST https://bamakor…/api/integrations/fixly/webhook
 */
export async function emitJobStatusWebhook(input: {
  callbackUrl: string | null | undefined
  payload: WebhookPayload
  fetchImpl?: typeof fetch
  sleepImpl?: (ms: number) => Promise<void>
  maxAttempts?: number
  backoffMs?: readonly number[]
}): Promise<EmitWebhookResult> {
  const dryEnv = process.env.FIXLY_WEBHOOK_DRY_RUN === '1'
  const secret = getWebhookSecret()
  const body = JSON.stringify(input.payload)
  const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const backoff = input.backoffMs ?? DEFAULT_BACKOFF_MS

  if (!input.callbackUrl || dryEnv) {
    console.info('[fixly→bamakor webhook]', body)
    return {
      delivered: false,
      httpStatus: null,
      error: null,
      payload: input.payload,
      dryRun: true,
      attempts: 0,
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Fixly-Webhook/1.0',
    'X-Fixly-Event': input.payload.event,
    'X-Fixly-Job-Id': input.payload.job_id,
  }

  if (secret) {
    headers['X-Fixly-Signature'] = `sha256=${signWebhookBody(body, secret)}`
  }

  const fetchFn = input.fetchImpl ?? fetch
  let lastStatus: number | null = null
  let lastError: string | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = backoff[attempt - 1] ?? backoff[backoff.length - 1] ?? 0
    await sleep(delay, input.sleepImpl)

    try {
      const res = await fetchFn(input.callbackUrl, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      })
      lastStatus = res.status
      if (res.ok) {
        return {
          delivered: true,
          httpStatus: res.status,
          error: null,
          payload: input.payload,
          dryRun: false,
          attempts: attempt,
        }
      }
      const text = await res.text().catch(() => '')
      lastError = text.slice(0, 500) || `HTTP ${res.status}`
      // Retry 5xx / 408 / 429; do not retry most 4xx
      if (res.status < 500 && res.status !== 408 && res.status !== 429) {
        break
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'webhook_failed'
      lastStatus = null
    }
  }

  console.warn(
    `[fixly→bamakor webhook] failed after ${maxAttempts} attempts:`,
    lastError,
  )

  return {
    delivered: false,
    httpStatus: lastStatus,
    error: lastError,
    payload: input.payload,
    dryRun: false,
    attempts: maxAttempts,
  }
}
