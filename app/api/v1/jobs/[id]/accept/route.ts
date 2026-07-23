import { NextResponse } from 'next/server'
import { assertApiKey } from '@/lib/integrations/bamakor/auth'
import { acceptOfferSchema } from '@/lib/integrations/bamakor/schemas'
import { acceptJobOffer } from '@/lib/integrations/bamakor/jobs-service'
import { parseJsonBody } from '@/lib/api/parse-body'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/v1/jobs/:id/accept
 * Partner/smoke path: accept as a matched provider (first-accept wins).
 * Production pros still use /api/requests/[id]/accept-invite with Supabase auth.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = assertApiKey(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const parsed = await parseJsonBody(request, acceptOfferSchema)
    if (!parsed.success) return parsed.response

    const { job, webhook } = await acceptJobOffer(id, parsed.data.provider_id)

    return NextResponse.json({
      ok: true,
      job_id: job.job_id,
      status: job.status,
      assigned_provider_id: job.assigned_provider_id,
      webhook: {
        delivered: webhook.delivered,
        dry_run: webhook.dryRun,
        payload: webhook.payload,
      },
      job,
    })
  } catch (error) {
    trackError(error, { route: 'POST /api/v1/jobs/[id]/accept' })
    const message = error instanceof Error ? error.message : 'accept_failed'
    const status =
      message === 'Job not found' || message === 'No invite for provider'
        ? 404
        : message === 'Already assigned' || message === 'Job not open for accept'
          ? 409
          : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
