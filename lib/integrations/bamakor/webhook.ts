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
}

/**
 * Emit signed status webhook to Bamakor (or log when callback_url missing / FIXLY_WEBHOOK_DRY_RUN=1).
 */
export async function emitJobStatusWebhook(input: {
  callbackUrl: string | null | undefined
  payload: WebhookPayload
  fetchImpl?: typeof fetch
}): Promise<EmitWebhookResult> {
  const dryEnv = process.env.FIXLY_WEBHOOK_DRY_RUN === '1'
  const secret = getWebhookSecret()
  const body = JSON.stringify(input.payload)

  if (!input.callbackUrl || dryEnv) {
    console.info('[fixly→bamakor webhook]', body)
    return {
      delivered: false,
      httpStatus: null,
      error: null,
      payload: input.payload,
      dryRun: true,
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
  try {
    const res = await fetchFn(input.callbackUrl, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        delivered: false,
        httpStatus: res.status,
        error: text.slice(0, 500) || `HTTP ${res.status}`,
        payload: input.payload,
        dryRun: false,
      }
    }
    return {
      delivered: true,
      httpStatus: res.status,
      error: null,
      payload: input.payload,
      dryRun: false,
    }
  } catch (err) {
    return {
      delivered: false,
      httpStatus: null,
      error: err instanceof Error ? err.message : 'webhook_failed',
      payload: input.payload,
      dryRun: false,
    }
  }
}