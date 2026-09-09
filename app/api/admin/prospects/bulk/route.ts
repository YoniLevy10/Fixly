import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { parseJsonBody } from '@/lib/api/parse-body'
import { bulkProspectStatusSchema } from '@/lib/api/schemas'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { bulkUpdateStatus } from '@/lib/prospects/service'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

/** Bulk status update only — never sends messages. */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'admin-prospects-bulk', 10, 60_000)
  if (limited) return limited

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, bulkProspectStatusSchema)
  if (!parsed.success) return parsed.response

  try {
    const result = await bulkUpdateStatus(
      auth.admin,
      parsed.data.ids,
      parsed.data.status,
      auth.user.id,
    )
    return NextResponse.json(result)
  } catch (error) {
    trackError(error, { route: 'POST /api/admin/prospects/bulk' })
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 })
  }
}
