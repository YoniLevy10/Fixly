import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { recordBillingEvent } from '@/lib/monetization/record-billing'

/**
 * On first completed job for a referred customer, reward the referrer
 * with +1 lead credit (if they are a professional).
 */
export async function fulfillReferralReward(
  referredUserId: string,
  requestId: string,
): Promise<void> {
  const admin = getAdminSupabaseClient()
  if (!admin) return

  const { data: redemption } = await admin
    .from('referral_redemptions')
    .select('id, referrer_user_id, status')
    .eq('referred_user_id', referredUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!redemption?.referrer_user_id) return

  const { data: referrerPro } = await admin
    .from('professionals')
    .select('id, lead_credits')
    .eq('user_id', redemption.referrer_user_id)
    .maybeSingle()

  if (!referrerPro) {
    await admin
      .from('referral_redemptions')
      .update({ status: 'rewarded', request_id: requestId })
      .eq('id', redemption.id)
    return
  }

  const credits = (referrerPro.lead_credits as number) ?? 0
  await admin
    .from('professionals')
    .update({ lead_credits: credits + 1 })
    .eq('id', referrerPro.id)

  await admin
    .from('referral_redemptions')
    .update({ status: 'rewarded', request_id: requestId })
    .eq('id', redemption.id)

  await recordBillingEvent({
    professionalId: referrerPro.id,
    requestId,
    eventType: 'lead_waived',
    amountAgorot: 0,
    metadata: { reason: 'referral_reward', referredUserId },
  })
}
