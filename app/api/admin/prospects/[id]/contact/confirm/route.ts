import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { confirmContactSent } from '@/lib/prospects/service'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** Mark outreach as sent — separate from opening wa.me. */
export async function POST(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(
    request,
    'admin-prospects-contact-confirm',
    30,
    60_000,
  )
  if (limited) return limited

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params

  try {
    const prospect = await confirmContactSent(auth.admin, id, auth.user.id)
    return NextResponse.json({ prospect })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Confirm failed'
    trackError(error, {
      route: 'POST /api/admin/prospects/[id]/contact/confirm',
    })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
