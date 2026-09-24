import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  findRunningDiscoveryRunId,
  runProspectDiscoveryChunks,
} from '@/lib/prospects/discover'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Frequent legal discovery resume — continues any incomplete `running`
 * cursor first, otherwise starts a fresh session. Client leave-screen
 * no longer kills progress: this cron finishes the same run.
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
    const continueRunId = await findRunningDiscoveryRunId(admin)
    // Keep cron sessions short so Vercel does not 504 at maxDuration (120s).
    // Incomplete runs stay `running` and resume on the next cron tick.
    const result = await runProspectDiscoveryChunks(admin, {
      trigger: 'cron',
      // Free-only: never start Google Places from cron (even if API key exists).
      sources: continueRunId ? undefined : ['osm', 'gov_pest_control'],
      continueRunId,
      maxSessionMs: 70_000,
      maxChunks: 2,
    })
    return NextResponse.json(result, {
      status:
        result.status === 'failed'
          ? 500
          : result.status === 'busy'
            ? 409
            : 200,
    })
  } catch (error) {
    trackError(error, { route: 'GET /api/cron/discover-prospects' })
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 })
  }
}
