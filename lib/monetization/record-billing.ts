import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { monetizationConfig, computeCommissionAgorot } from '@/lib/monetization/config'
import type { BillingEventType } from '@/lib/monetization/types'
import { isSupabaseEnabled } from '@/lib/data/config'

type RecordBillingInput = {
  professionalId: string
  requestId?: string
  eventType: BillingEventType
  amountAgorot: number
  metadata?: Record<string, unknown>
}

/** Persist billing events with service-role (RLS blocks user-client inserts). */
export async function recordBillingEvent(input: RecordBillingInput): Promise<void> {
  if (!isSupabaseEnabled()) return

  const supabase = getAdminSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from('billing_events').insert({
    professional_id: input.professionalId,
    request_id: input.requestId ?? null,
    event_type: input.eventType,
    amount_agorot: input.amountAgorot,
    currency: monetizationConfig.currency,
    metadata: input.metadata ?? {},
  })
  if (error) {
    console.error('[billing] recordBillingEvent failed', error.message)
  }
}

/** On request accepted: charge lead or waive if Pro / credits remain */
export async function handleLeadOnAccept(
  professionalId: string,
  requestId: string
): Promise<{ charged: boolean; amountAgorot: number }> {
  if (!isSupabaseEnabled()) {
    return { charged: false, amountAgorot: 0 }
  }

  const supabase = getAdminSupabaseClient()
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
    const { error: creditError } = await supabase
      .from('professionals')
      .update({ lead_credits: credits - 1 })
      .eq('id', professionalId)

    if (creditError) {
      console.error('[billing] lead_credits decrement failed', creditError.message)
    }

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
    metadata: { note: 'accrued — collect via Tranzila when enabled' },
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
    const supabase = getAdminSupabaseClient()
    if (supabase) {
      const { error } = await supabase
        .from('requests')
        .update({ platform_fee_agorot: commission })
        .eq('id', requestId)
      if (error) {
        console.error('[billing] platform_fee update failed', error.message)
      }
    }
  }

  return commission
}
