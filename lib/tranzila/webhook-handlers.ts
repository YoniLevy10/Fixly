import type { SupabaseClient } from '@supabase/supabase-js'

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

export async function handleTranzilaWebhookEvent(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
): Promise<void> {
  const response = asString(body.Response)
  const confirmationCode = asString(body.ConfirmationCode)
  const tranzilaToken = asString(body.TranzilaTK)
  const sum = asNumber(body.sum) ?? (typeof body.sum === 'string' ? Number(body.sum) : undefined)
  const requestParams = body.request_params as Record<string, unknown> | undefined
  const paymentType = asString(requestParams?.type)
  const professionalId = asString(requestParams?.professional_id)
  const requestId = asString(requestParams?.request_id)
  const supplier = asString(body.supplier)

  // Response '000' = success
  if (response !== '000') return

  if (professionalId) {
    await supabase.from('billing_events').insert({
      professional_id: professionalId,
      request_id: requestId ?? null,
      event_type: paymentType || 'payment',
      amount_agorot: sum ? Math.round(sum * 100) : 0,
      currency: 'ils',
      metadata: {
        tranzilaToken,
        confirmationCode,
        supplier,
      },
    })
  }

  if (paymentType === 'pro_subscription' && professionalId) {
    const until = new Date()
    until.setMonth(until.getMonth() + 1)
    await supabase
      .from('professionals')
      .update({
        subscription_tier: 'pro',
        subscription_until: until.toISOString(),
        tranzila_token: tranzilaToken,
      })
      .eq('id', professionalId)

    if (tranzilaToken) {
      const { createRecurringSubscription } = await import('./sto')
      const { monetizationConfig } = await import('@/lib/monetization/config')
      const recurring = await createRecurringSubscription({
        professionalId,
        token: tranzilaToken,
        amount: monetizationConfig.proSubscriptionAgorot / 100,
        interval: 'monthly',
      })
      if (recurring.success) {
        await supabase
          .from('professionals')
          .update({
            tranzila_sto_id: recurring.stoId,
          })
          .eq('id', professionalId)
      }
    }
  }

  if (paymentType === 'job_payment' && requestId) {
    await supabase
      .from('requests')
      .update({
        payment_status: 'paid',
        payment_amount_agorot: sum ? Math.round(sum * 100) : 0,
      })
      .eq('id', requestId)
  }
}
