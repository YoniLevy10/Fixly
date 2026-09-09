import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { prepareContactLink } from '@/lib/prospects/service'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** Manual WhatsApp only — returns wa.me link; does not send messages. */
export async function POST(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(request, 'admin-prospects-contact', 20, 60_000)
  if (limited) return limited

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params

  try {
    const result = await prepareContactLink(auth.admin, id, auth.user.id)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Contact failed'
    trackError(error, { route: 'POST /api/admin/prospects/[id]/contact' })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
