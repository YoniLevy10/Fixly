import { monetizationConfig, computeCommissionAgorot } from '@/lib/monetization/config'

type JobCheckoutResult =
  | { configured: true; url: string }
  | { configured: false; message: string }

/**
 * Stripe Checkout for completed job payment (one-time).
 */
export async function createJobPaymentCheckout(input: {
  requestId: string
  professionalId: string
  amountIls: number
  successUrl: string
  cancelUrl: string
}): Promise<JobCheckoutResult> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return { configured: false, message: 'Stripe not configured' }
  }

  const amountAgorot = Math.round(input.amountIls * 100)
  if (amountAgorot < 100) {
    return { configured: false, message: 'Amount too small' }
  }

  const params = new URLSearchParams({
    mode: 'payment',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.requestId,
    'line_items[0][price_data][currency]': monetizationConfig.currency,
    'line_items[0][price_data][unit_amount]': String(amountAgorot),
    'line_items[0][price_data][product_data][name]': 'Fixly — תשלום עבור עבודה',
    'line_items[0][quantity]': '1',
    'metadata[request_id]': input.requestId,
    'metadata[professional_id]': input.professionalId,
    'metadata[type]': 'job_payment',
  })

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    console.error('[stripe] job checkout', await res.text())
    return { configured: false, message: 'Checkout creation failed' }
  }

  const session = (await res.json()) as { url?: string; id?: string }
  if (!session.url) {
    return { configured: false, message: 'No checkout URL' }
  }

  return { configured: true, url: session.url }
}

export function computeJobPlatformFee(amountIls: number): number {
  return computeCommissionAgorot(amountIls) / 100
}
