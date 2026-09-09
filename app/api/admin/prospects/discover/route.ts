import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { z } from 'zod'
import {
  listDiscoveryRuns,
  runProspectDiscovery,
  type DiscoveryProgress,
} from '@/lib/prospects/discover'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const discoverSchema = z.object({
  sources: z
    .array(
      z.enum(['google_places', 'osm', 'brave_web', 'gov_pest_control']),
    )
    .min(1)
    .max(4)
    .optional(),
  city: z.string().trim().min(1).max(100).optional(),
  /** Opt-in only — default is cumulative merge */
  replacePrevious: z.boolean().optional(),
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
  const limited = await enforceRateLimit(request, 'admin-prospects-discover', 3, 60_000)
  if (limited) return limited

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, discoverSchema)
  if (!parsed.success) return parsed.response

  try {
    const result = await runProspectDiscovery(auth.admin, {
      trigger: 'manual',
      actorUserId: auth.user.id,
      sources: parsed.data.sources,
      city: parsed.data.city,
      replacePrevious: parsed.data.replacePrevious === true,
    })
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
