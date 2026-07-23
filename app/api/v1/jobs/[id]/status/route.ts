import { NextResponse } from 'next/server'
import { assertApiKey } from '@/lib/integrations/bamakor/auth'
import { updateJobStatusSchema } from '@/lib/integrations/bamakor/schemas'
import { updateJobStatus } from '@/lib/integrations/bamakor/jobs-service'
import { parseJsonBody } from '@/lib/api/parse-body'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** PATCH /api/v1/jobs/:id/status — advance lifecycle + emit Bamakor webhook */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = assertApiKey(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, updateJobStatusSchema)
    if (!parsed.success) return parsed.response

    const { job, webhook } = await updateJobStatus(id, parsed.data.status, {
      note: parsed.data.note,
    })

    return NextResponse.json({
      ok: true,
      job_id: job.job_id,
      status: job.status,
      webhook: {
        delivered: webhook.delivered,
        dry_run: webhook.dryRun,
        http_status: webhook.httpStatus,
        payload: webhook.payload,
      },
      job,
    })
  } catch (error) {
    trackError(error, { route: 'PATCH /api/v1/jobs/[id]/status' })
    const message = error instanceof Error ? error.message : 'update_failed'
    const status =
      message === 'Job not found'
        ? 404
        : message.startsWith('Invalid transition')
          ? 409
          : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
