import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

/**
 * Monthly lead credit reset — call via Vercel Cron or external scheduler.
 * Protect with CRON_SECRET header.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })
  }

  try {
    const { error } = await supabase.rpc('reset_monthly_lead_credits')
    if (error) {
      trackError(error, { route: 'GET /api/cron/reset-lead-credits' })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, resetAt: new Date().toISOString() })
  } catch (error) {
    trackError(error, { route: 'GET /api/cron/reset-lead-credits' })
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
