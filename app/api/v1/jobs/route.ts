import { NextResponse } from 'next/server'
import { assertApiKey } from '@/lib/integrations/bamakor/auth'
import { createJobSchema } from '@/lib/integrations/bamakor/schemas'
import { createJob } from '@/lib/integrations/bamakor/jobs-service'
import { parseJsonBody } from '@/lib/api/parse-body'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

/** POST /api/v1/jobs — Bamakor (or partner) creates a Fixly job */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'v1-jobs-post', 60, 60_000)
  if (limited) return limited

  const auth = assertApiKey(request)
  if (!auth.ok) return auth.response

  try {
    const parsed = await parseJsonBody(request, createJobSchema)
    if (!parsed.success) return parsed.response

    const body = parsed.data
    if (auth.bamakorClientId && body.external_ref && !body.external_ref.client_id) {
      body.external_ref.client_id = auth.bamakorClientId
    }

    const { job } = await createJob(body)

    return NextResponse.json(
      {
        ok: true,
        job_id: job.job_id,
        status: job.status === 'offered' ? 'open' : job.status,
        matched_providers: job.matched_providers,
        job,
      },
      { status: 201 },
    )
  } catch (error) {
    trackError(error, { route: 'POST /api/v1/jobs' })
    const message = error instanceof Error ? error.message : 'create_failed'
    const status = message.startsWith('Unknown category') ? 400 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
