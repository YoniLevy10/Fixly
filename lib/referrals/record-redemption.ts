import { getAdminSupabaseClient } from '@/lib/supabase/admin'

export async function recordReferralRedemption(input: {
  referralCode: string
  referredUserId: string
  requestId: string
}): Promise<void> {
  const admin = getAdminSupabaseClient()
  if (!admin) return

  const { data: ref } = await admin
    .from('referral_codes')
    .select('user_id, code, uses_count')
    .eq('code', input.referralCode)
    .maybeSingle()

  if (!ref || ref.user_id === input.referredUserId) return

  await admin.from('referral_redemptions').insert({
    referral_code: ref.code,
    referrer_user_id: ref.user_id,
    referred_user_id: input.referredUserId,
    request_id: input.requestId,
    status: 'pending',
  })

  await admin
    .from('referral_codes')
    .update({ uses_count: (ref.uses_count ?? 0) + 1 })
    .eq('code', ref.code)
}
