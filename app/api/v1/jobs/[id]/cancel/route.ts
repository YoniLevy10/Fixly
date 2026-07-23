import { NextResponse } from 'next/server'
import { assertApiKey } from '@/lib/integrations/bamakor/auth'
import { cancelJob } from '@/lib/integrations/bamakor/jobs-service'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** POST /api/v1/jobs/:id/cancel — partner cancels a Fixly job + webhook */
export async function POST(request: Request, context: RouteContext) {
  const auth = assertApiKey(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    let reason: string | undefined
    try {
      const raw = await request.json()
      if (raw && typeof raw === 'object' && 'reason' in raw) {
        const r = (raw as { reason?: unknown }).reason
        if (typeof r === 'string') reason = r.trim().slice(0, 1000) || undefined
      }
    } catch {
      // empty body is fine
    }

    const { job, webhook } = await cancelJob(id, { reason })

    return NextResponse.json({
      ok: true,
      job_id: job.job_id,
      status: job.status,
      webhook: {
        delivered: webhook.delivered,
        dry_run: webhook.dryRun,
        attempts: webhook.attempts,
        payload: webhook.payload,
      },
      job,
    })
  } catch (error) {
    trackError(error, { route: 'POST /api/v1/jobs/[id]/cancel' })
    const message = error instanceof Error ? error.message : 'cancel_failed'
    const status =
      message === 'Job not found'
        ? 404
        : message.startsWith('Invalid transition') || message.includes('already')
          ? 409
          : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
