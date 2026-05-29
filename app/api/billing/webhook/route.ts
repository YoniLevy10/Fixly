import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

/**
 * Stripe webhook — activate Pro subscription on checkout.session.completed.
 * Configure endpoint: https://your-domain/api/billing/webhook
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ received: true, note: 'webhook secret not set' })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  // Production: verify with stripe.webhooks.constructEvent (install stripe package)
  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(body) as typeof event
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const professionalId =
      (session.metadata as Record<string, string> | undefined)?.professional_id ||
      (session.client_reference_id as string | undefined)

    if (professionalId) {
      const supabase = getAdminSupabaseClient()
      if (supabase) {
        const until = new Date()
        until.setMonth(until.getMonth() + 1)

        await supabase
          .from('professionals')
          .update({
            subscription_tier: 'pro',
            subscription_until: until.toISOString(),
          })
          .eq('id', professionalId)

        await supabase.from('billing_events').insert({
          professional_id: professionalId,
          event_type: 'subscription_started',
          amount_agorot: 0,
          currency: 'ils',
          metadata: { stripeSessionId: session.id },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
