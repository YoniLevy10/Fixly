import { NextResponse } from 'next/server'
import { assertApiKey } from '@/lib/integrations/bamakor/auth'
import { getJob } from '@/lib/integrations/bamakor/jobs-service'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/v1/jobs/:id — job status + offers + events */
export async function GET(_request: Request, context: RouteContext) {
  const auth = assertApiKey(_request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const job = await getJob(id)
    if (!job) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, job })
  } catch (error) {
    trackError(error, { route: 'GET /api/v1/jobs/[id]' })
    return NextResponse.json({ ok: false, error: 'fetch_failed' }, { status: 500 })
  }
}
