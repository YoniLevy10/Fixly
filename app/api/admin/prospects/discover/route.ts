import { after, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { z } from 'zod'
import {
  findRunningDiscoveryRunId,
  forceUnlockDiscoveryRuns,
  listDiscoveryRuns,
  runProspectDiscoveryChunks,
  type DiscoveryAutoSource,
  type DiscoveryProgress,
} from '@/lib/prospects/discover'
import { filterDiscoverySources } from '@/lib/prospects/config'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
/** Multi-chunk discovery session — server owns the loop (leave-screen safe). */
export const maxDuration = 120

const discoverSchema = z.object({
  sources: z
    .array(z.enum(['google_places', 'osm', 'gov_pest_control']))
    .min(1)
    .max(3)
    .optional(),
  city: z.string().trim().min(1).max(100).optional(),
  /** Opt-in only — default is cumulative merge */
  replacePrevious: z.boolean().optional(),
  /** Continue a chunked run (from previous `continue` response) */
  continueRunId: z.string().uuid().optional().nullable(),
})

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const runs = await listDiscoveryRuns(auth.admin, 15)
    const running = runs.find((r) => r.status === 'running')
    const progress =
      running &&
      running.details &&
      typeof running.details === 'object' &&
      (running.details as { progress?: unknown }).progress
        ? (running.details as { progress: DiscoveryProgress }).progress
        : null
    return NextResponse.json({ runs, progress, runningRunId: running?.id ?? null })
  } catch (error) {
    trackError(error, { route: 'GET /api/admin/prospects/discover' })
    return NextResponse.json({ error: 'Failed to list runs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Allow several sessions per minute (poll + resume).
  const limited = await enforceRateLimit(request, 'admin-prospects-discover', 40, 60_000)
  if (limited) return limited

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, discoverSchema)
  if (!parsed.success) return parsed.response

  try {
    let continueRunId = parsed.data.continueRunId ?? null
    if (!continueRunId) {
      continueRunId = await findRunningDiscoveryRunId(auth.admin)
    }

    // Strip google_places unless FIXLY_GOOGLE_PLACES_ENABLED=true (free-only default).
    const sources = parsed.data.sources
      ? (filterDiscoverySources(parsed.data.sources) as DiscoveryAutoSource[])
      : undefined

    let result = await runProspectDiscoveryChunks(auth.admin, {
      trigger: 'manual',
      actorUserId: auth.user.id,
      sources,
      city: parsed.data.city,
      replacePrevious:
        continueRunId ? false : parsed.data.replacePrevious === true,
      continueRunId,
    })

    if (result.status === 'busy' && !continueRunId) {
      const unlocked = await forceUnlockDiscoveryRuns(auth.admin)
      if (unlocked > 0) {
        result = await runProspectDiscoveryChunks(auth.admin, {
          trigger: 'manual',
          actorUserId: auth.user.id,
          sources,
          city: parsed.data.city,
          replacePrevious: parsed.data.replacePrevious === true,
        })
      }
    }

    // If more work remains, keep processing after the response so leaving
    // the Superadmin screen does not stop discovery.
    if (result.status === 'continue' && result.continueRunId) {
      const resumeId = result.continueRunId
      after(async () => {
        try {
          await runProspectDiscoveryChunks(auth.admin, {
            trigger: 'manual',
            actorUserId: auth.user.id,
            continueRunId: resumeId,
          })
        } catch (error) {
          trackError(error, {
            route: 'POST /api/admin/prospects/discover after',
          })
        }
      })
    }

    const statusCode =
      result.status === 'busy'
        ? 409
        : result.status === 'failed' && result.created === 0
          ? 400
          : 200
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    trackError(error, { route: 'POST /api/admin/prospects/discover' })
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 })
  }
}

/** Force-clear stuck `running` locks (serverless kill leftover). */
export async function DELETE() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const unlocked = await forceUnlockDiscoveryRuns(auth.admin)
    const runs = await listDiscoveryRuns(auth.admin, 15)
    return NextResponse.json({ unlocked, runs })
  } catch (error) {
    trackError(error, { route: 'DELETE /api/admin/prospects/discover' })
    return NextResponse.json({ error: 'Unlock failed' }, { status: 500 })
  }
}
