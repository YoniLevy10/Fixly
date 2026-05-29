import { monetizationConfig } from '@/lib/monetization/config'

type CheckoutResult =
  | { configured: true; url: string }
  | { configured: false; message: string }

/**
 * Creates a Stripe Checkout session for Pro subscription (REST, no SDK dep).
 * Requires STRIPE_SECRET_KEY and STRIPE_PRICE_PRO_MONTHLY (price_xxx).
 */
export async function createProSubscriptionCheckout(
  professionalId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutResult> {
  const secret = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY

  if (!secret || !priceId) {
    return {
      configured: false,
      message:
        'הגדר STRIPE_SECRET_KEY ו-STRIPE_PRICE_PRO_MONTHLY — ראה docs/MONETIZATION.md',
    }
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: professionalId,
    'metadata[professional_id]': professionalId,
    'subscription_data[metadata][professional_id]': professionalId,
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
    const err = await res.text()
    console.error('[stripe] checkout', err)
    return { configured: false, message: 'שגיאה ביצירת תשלום' }
  }

  const session = (await res.json()) as { url?: string }
  if (!session.url) {
    return { configured: false, message: 'לא התקבל קישור תשלום' }
  }

  return { configured: true, url: session.url }
}

export function getProPriceDisplayIls(): number {
  return monetizationConfig.proSubscriptionAgorot / 100
}
