import { monetizationConfig, computeCommissionAgorot } from '@/lib/monetization/config'
import type { BillingEventType } from '@/lib/monetization/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isSupabaseEnabled } from '@/lib/data/config'

type RecordBillingInput = {
  professionalId: string
  requestId?: string
  eventType: BillingEventType
  amountAgorot: number
  metadata?: Record<string, unknown>
}

export async function recordBillingEvent(input: RecordBillingInput): Promise<void> {
  if (!isSupabaseEnabled()) return

  const supabase = await createServerSupabaseClient()
  if (!supabase) return

  await supabase.from('billing_events').insert({
    professional_id: input.professionalId,
    request_id: input.requestId ?? null,
    event_type: input.eventType,
    amount_agorot: input.amountAgorot,
    currency: monetizationConfig.currency,
    metadata: input.metadata ?? {},
  })
}

/** On request accepted: charge lead or waive if Pro / credits remain */
export async function handleLeadOnAccept(
  professionalId: string,
  requestId: string
): Promise<{ charged: boolean; amountAgorot: number }> {
  if (!isSupabaseEnabled()) {
    return { charged: false, amountAgorot: 0 }
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) return { charged: false, amountAgorot: 0 }

  const { data: pro } = await supabase
    .from('professionals')
    .select('subscription_tier, lead_credits, subscription_until')
    .eq('id', professionalId)
    .single()

  if (!pro) return { charged: false, amountAgorot: 0 }

  const tier = (pro.subscription_tier as string) || 'free'
  const subActive =
    pro.subscription_until &&
    new Date(pro.subscription_until as string) > new Date()

  if (tier === 'pro' || tier === 'pro_plus' || subActive) {
    await recordBillingEvent({
      professionalId,
      requestId,
      eventType: 'lead_waived',
      amountAgorot: 0,
      metadata: { reason: 'active_subscription', tier },
    })
    return { charged: false, amountAgorot: 0 }
  }

  const credits = (pro.lead_credits as number) ?? 0
  if (credits > 0) {
    await supabase
      .from('professionals')
      .update({ lead_credits: credits - 1 })
      .eq('id', professionalId)

    await recordBillingEvent({
      professionalId,
      requestId,
      eventType: 'lead_waived',
      amountAgorot: 0,
      metadata: { reason: 'free_credit', remaining: credits - 1 },
    })
    return { charged: false, amountAgorot: 0 }
  }

  const fee = monetizationConfig.leadFeeAgorot
  await recordBillingEvent({
    professionalId,
    requestId,
    eventType: 'lead_charged',
    amountAgorot: fee,
    metadata: { note: 'accrued — collect via Stripe when enabled' },
  })

  return { charged: true, amountAgorot: fee }
}

/** On completed + quoted amount: accrue platform commission */
export async function handleCommissionOnComplete(
  professionalId: string,
  requestId: string,
  quotedAmountIls: number
): Promise<number> {
  if (!quotedAmountIls || quotedAmountIls <= 0) return 0

  const commission = computeCommissionAgorot(quotedAmountIls)

  await recordBillingEvent({
    professionalId,
    requestId,
    eventType: 'commission_accrued',
    amountAgorot: commission,
    metadata: { quotedAmountIls },
  })

  if (isSupabaseEnabled()) {
    const supabase = await createServerSupabaseClient()
    if (supabase) {
      await supabase
        .from('requests')
        .update({ platform_fee_agorot: commission })
        .eq('id', requestId)
    }
  }

  return commission
}
