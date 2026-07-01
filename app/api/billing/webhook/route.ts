import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { verifyStripeWebhook } from '@/lib/stripe/verify-webhook'
import { handleStripeWebhookEvent } from '@/lib/stripe/webhook-handlers'
import { trackError } from '@/lib/monitoring/track-error'
import { isProduction } from '@/lib/data/config'

/**
 * Stripe webhook — activate Pro subscription on checkout.session.completed.
 * Configure endpoint: https://your-domain/api/billing/webhook
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    if (isProduction()) {
      return NextResponse.json({ error: 'webhook not configured' }, { status: 503 })
    }
    return NextResponse.json({ received: true, note: 'webhook secret not set' })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const verified = verifyStripeWebhook(body, sig, secret)
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 })
  }

  const supabase = getAdminSupabaseClient()
  if (!supabase) {
    trackError(new Error('SUPABASE_SERVICE_ROLE_KEY missing for webhook'), {
      route: 'POST /api/billing/webhook',
    })
    return NextResponse.json({ error: 'admin client unavailable' }, { status: 503 })
  }

  try {
    await handleStripeWebhookEvent(supabase, verified.event)
    return NextResponse.json({ received: true })
  } catch (error) {
    trackError(error, {
      route: 'POST /api/billing/webhook',
      eventType: String(verified.event.type ?? 'unknown'),
    })
    return NextResponse.json({ error: 'webhook handler failed' }, { status: 500 })
  }
}
