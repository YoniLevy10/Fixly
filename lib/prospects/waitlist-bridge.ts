import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { linkProspectOnWaitlistJoin } from '@/lib/prospects/service'

/** Best-effort link after professional waitlist signup. Never throws. */
export async function tryLinkProspectAfterWaitlist(input: {
  phone: string
  audience: string
  waitlistId?: string | null
}): Promise<void> {
  if (input.audience !== 'professional') return
  const admin = getAdminSupabaseClient()
  if (!admin) return
  try {
    await linkProspectOnWaitlistJoin(admin, {
      phone: input.phone,
      waitlistId: input.waitlistId,
    })
  } catch (error) {
    console.warn(
      '[prospects] waitlist link failed',
      error instanceof Error ? error.message : error,
    )
  }
}
