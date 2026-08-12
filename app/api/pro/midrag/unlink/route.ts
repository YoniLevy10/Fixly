import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

/** DELETE /api/pro/midrag/unlink — unlink Midrag profile + delete imported reviews */
export async function DELETE(request: Request) {
  const limited = await enforceRateLimit(request, 'pro-midrag-unlink', 20, 60_000)
  if (limited) return limited

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'no_session' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: pro } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro) return NextResponse.json({ error: 'no_pro_profile' }, { status: 404 })

  const { error: updateError } = await supabase
    .from('professionals')
    .update({
      midrag_profile_url: null,
      midrag_rating: null,
      midrag_reviews_count: 0,
      midrag_last_synced_at: null,
      midrag_verified: false,
    })
    .eq('id', pro.id)

  if (updateError) {
    trackError(updateError, { route: 'DELETE /api/pro/midrag/unlink' })
    return NextResponse.json({ error: 'unlink_failed' }, { status: 500 })
  }

  const { error: deleteError } = await supabase
    .from('external_reviews')
    .delete()
    .eq('professional_id', pro.id)
    .eq('source', 'midrag')

  if (deleteError) {
    trackError(deleteError, { route: 'DELETE /api/pro/midrag/unlink.reviews' })
  }

  return NextResponse.json({ ok: true })
}
