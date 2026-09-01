import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

/**
 * Daily Supabase keep-alive — prevents free-tier project pause from inactivity.
 * Protected with CRON_SECRET; call via Vercel Cron or manual curl.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  try {
    const { error } = await supabase.rpc('keep_alive')
    if (error) {
      trackError(error, { route: 'GET /api/keepalive' })
      return NextResponse.json({ error: 'Keep-alive failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (error) {
    trackError(error, { route: 'GET /api/keepalive' })
    return NextResponse.json({ error: 'Keep-alive failed' }, { status: 500 })
  }
}
