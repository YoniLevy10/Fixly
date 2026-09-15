import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { runProspectDiscovery } from '@/lib/prospects/discover'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Daily legal discovery — runs several short chunks in one cron invocation
 * (Places → OSM → gov), then stops. Remaining Places jobs continue on the
 * next cron / manual Superadmin run via the same cumulative cursor.
 */
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
    let result = await runProspectDiscovery(admin, { trigger: 'cron' })
    let chunks = 1
    // Cap chunks so cron stays within wall time / cost.
    while (result.status === 'continue' && result.continueRunId && chunks < 8) {
      chunks += 1
      result = await runProspectDiscovery(admin, {
        trigger: 'cron',
        continueRunId: result.continueRunId,
      })
    }
    return NextResponse.json(
      { ...result, chunks },
      {
        status:
          result.status === 'failed'
            ? 500
            : result.status === 'busy'
              ? 409
              : 200,
      },
    )
  } catch (error) {
    trackError(error, { route: 'GET /api/cron/discover-prospects' })
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 })
  }
}
