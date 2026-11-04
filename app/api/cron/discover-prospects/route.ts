import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  findRunningDiscoveryRunId,
  runProspectDiscoveryChunks,
} from '@/lib/prospects/discover'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
/**
 * Ceiling above the soft session (70s, one category or one registry page).
 * This Pro Fluid project allows up to 800s; 180s only covers a slow ingest
 * so the cursor can commit. The platform default without this export is 300s.
 */
export const maxDuration = 180

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
    // One bounded chunk so the invocation returns inside maxDuration.
    // Incomplete runs stay `running` and resume on the next cron tick.
    const result = await runProspectDiscoveryChunks(admin, {
      trigger: 'cron',
      // Free-only: never start Google Places from cron (even if API key exists).
      sources: continueRunId ? undefined : ['osm', 'gov_pest_control'],
      continueRunId,
      // One OSM category or one gov page. The cursor stays `running` for the next tick.
      maxSessionMs: 70_000,
      maxChunks: 1,
    })
    console.info('[cron discover-prospects]', {
      status: result.status,
      runId: result.runId,
      chunks: result.chunks,
      phase: result.chunk?.phase ?? null,
      found: result.found,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
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
