import { monetizationConfig, computeCommissionAgorot } from '@/lib/monetization/config'

type CheckoutResult =
  | { configured: true; url: string }
  | { configured: false; message: string }

/** Create a Tranzila iframe checkout for Pro subscription (first month charge) */
export async function createProSubscriptionCheckout(params: {
  professionalId: string
  successUrl: string
  cancelUrl: string
}): Promise<CheckoutResult> {
  const { isTranzilaConfigured } = await import('./auth')
  const { createHandshake } = await import('./handshake')
  if (!isTranzilaConfigured()) return { configured: false, message: 'Tranzila not configured' }

  const terminal = process.env.TRANZILA_TERMINAL!
  const amount = monetizationConfig.proSubscriptionAgorot / 100

  const handshake = await createHandshake({
    terminalName: terminal,
    sum: amount,
    requestParams: { professional_id: params.professionalId, type: 'pro_subscription' },
  })
  if (!handshake.success) return { configured: false, message: handshake.message }

  const iframeUrl = new URL(`https://direct.tranzila.com/${terminal}/iframe.php`)
  iframeUrl.searchParams.set('thtk', handshake.thtk)
  iframeUrl.searchParams.set('sum', String(amount))
  iframeUrl.searchParams.set('currency', 'ILS')
  iframeUrl.searchParams.set('redirect_url', params.successUrl)
  iframeUrl.searchParams.set('cancel_url', params.cancelUrl)
  iframeUrl.searchParams.set('hide_cvv', '0')

  return { configured: true, url: iframeUrl.toString() }
}

/** Create a Tranzila checkout for job payment (one-time) */
export async function createJobPaymentCheckout(params: {
  requestId: string
  professionalId: string
  amountIls: number
  successUrl: string
  cancelUrl: string
}): Promise<CheckoutResult> {
  const { isTranzilaConfigured } = await import('./auth')
  const { createHandshake } = await import('./handshake')
  if (!isTranzilaConfigured()) return { configured: false, message: 'Tranzila not configured' }

  const terminal = process.env.TRANZILA_TERMINAL!
  if (params.amountIls < 5) return { configured: false, message: 'Amount too small (min 5 ILS)' }

  const handshake = await createHandshake({
    terminalName: terminal,
    sum: params.amountIls,
    requestParams: {
      request_id: params.requestId,
      professional_id: params.professionalId,
      type: 'job_payment',
    },
  })
  if (!handshake.success) return { configured: false, message: handshake.message }

  const iframeUrl = new URL(`https://direct.tranzila.com/${terminal}/iframe.php`)
  iframeUrl.searchParams.set('thtk', handshake.thtk)
  iframeUrl.searchParams.set('sum', String(params.amountIls))
  iframeUrl.searchParams.set('currency', 'ILS')
  iframeUrl.searchParams.set('redirect_url', params.successUrl)
  iframeUrl.searchParams.set('cancel_url', params.cancelUrl)

  return { configured: true, url: iframeUrl.toString() }
}

export function getProPriceDisplayIls(): number {
  return monetizationConfig.proSubscriptionAgorot / 100
}

export function computeJobPlatformFee(amountIls: number): number {
  return computeCommissionAgorot(amountIls) / 100
}
