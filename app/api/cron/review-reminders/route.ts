import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

/** Send review reminders for completed jobs without reviews (24h+) */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminSupabaseClient()
  if (!admin) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: pending } = await admin
      .from('requests')
      .select('id, customer_id, title, professional_id')
      .eq('status', 'completed')
      .is('review_prompted_at', null)
      .lt('accepted_at', cutoff)
      .limit(50)

    let prompted = 0
    for (const req of pending ?? []) {
      const { data: review } = await admin
        .from('reviews')
        .select('id')
        .eq('request_id', req.id)
        .maybeSingle()

      if (review) continue

      await admin
        .from('requests')
        .update({ review_prompted_at: new Date().toISOString() })
        .eq('id', req.id)

      prompted += 1
    }

    return NextResponse.json({ ok: true, prompted, checked: pending?.length ?? 0 })
  } catch (error) {
    trackError(error, { route: 'review-reminders cron' })
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
