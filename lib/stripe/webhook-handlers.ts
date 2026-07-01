import type { SupabaseClient } from '@supabase/supabase-js'
import { monetizationConfig } from '@/lib/monetization/config'

type StripeObject = Record<string, unknown>

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function periodEndIso(subscription: StripeObject): string {
  const end = asNumber(subscription.current_period_end)
  if (end) return new Date(end * 1000).toISOString()
  const until = new Date()
  until.setMonth(until.getMonth() + 1)
  return until.toISOString()
}

async function billingEventExists(
  supabase: SupabaseClient,
  stripeEventId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('billing_events')
    .select('id')
    .contains('metadata', { stripeEventId })
    .limit(1)
    .maybeSingle()
  return Boolean(data)
}

async function recordWebhookBillingEvent(
  supabase: SupabaseClient,
  input: {
    professionalId: string
    eventType: string
    amountAgorot?: number
    stripeEventId: string
    extra?: Record<string, unknown>
  },
): Promise<void> {
  if (await billingEventExists(supabase, input.stripeEventId)) return

  await supabase.from('billing_events').insert({
    professional_id: input.professionalId,
    event_type: input.eventType,
    amount_agorot: input.amountAgorot ?? 0,
    currency: 'ils',
    metadata: {
      stripeEventId: input.stripeEventId,
      ...input.extra,
    },
  })
}

function professionalIdFromMetadata(metadata?: StripeObject): string | undefined {
  if (!metadata) return undefined
  return asString(metadata.professional_id)
}

export async function handleStripeWebhookEvent(
  supabase: SupabaseClient,
  event: Record<string, unknown>,
): Promise<void> {
  const type = asString(event.type)
  const eventId = asString(event.id) ?? crypto.randomUUID()
  const data = event.data as { object?: StripeObject } | undefined
  const object = data?.object
  if (!type || !object) return

  if (type === 'checkout.session.completed') {
    const professionalId =
      professionalIdFromMetadata(object.metadata as StripeObject | undefined) ||
      asString(object.client_reference_id)

    if (!professionalId) return

    const until = new Date()
    until.setMonth(until.getMonth() + 1)

    await supabase
      .from('professionals')
      .update({
        subscription_tier: 'pro',
        subscription_until: until.toISOString(),
        lead_credits: monetizationConfig.freeLeadCreditsPerMonth,
      })
      .eq('id', professionalId)

    await recordWebhookBillingEvent(supabase, {
      professionalId,
      eventType: 'subscription_started',
      stripeEventId: eventId,
      extra: { stripeSessionId: asString(object.id) },
    })
    return
  }

  if (type === 'customer.subscription.updated') {
    const professionalId = professionalIdFromMetadata(object.metadata as StripeObject | undefined)
    if (!professionalId) return

    const status = asString(object.status)
    const active = status === 'active' || status === 'trialing'

    await supabase
      .from('professionals')
      .update({
        subscription_tier: active ? 'pro' : 'free',
        subscription_until: active ? periodEndIso(object) : null,
        lead_credits: active ? monetizationConfig.freeLeadCreditsPerMonth : 0,
      })
      .eq('id', professionalId)

    await recordWebhookBillingEvent(supabase, {
      professionalId,
      eventType: active ? 'subscription_renewed' : 'subscription_paused',
      stripeEventId: eventId,
      extra: { status },
    })
    return
  }

  if (type === 'customer.subscription.deleted') {
    const professionalId = professionalIdFromMetadata(object.metadata as StripeObject | undefined)
    if (!professionalId) return

    await supabase
      .from('professionals')
      .update({
        subscription_tier: 'free',
        subscription_until: null,
      })
      .eq('id', professionalId)

    await recordWebhookBillingEvent(supabase, {
      professionalId,
      eventType: 'subscription_cancelled',
      stripeEventId: eventId,
    })
    return
  }

  if (type === 'invoice.payment_failed') {
    const professionalId = professionalIdFromMetadata(object.metadata as StripeObject | undefined)
    if (!professionalId) return

    await recordWebhookBillingEvent(supabase, {
      professionalId,
      eventType: 'payment_failed',
      stripeEventId: eventId,
      extra: { invoiceId: asString(object.id) },
    })
  }
}
