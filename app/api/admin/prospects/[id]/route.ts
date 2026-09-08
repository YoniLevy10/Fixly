import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { parseJsonBody } from '@/lib/api/parse-body'
import { updateProspectSchema } from '@/lib/api/schemas'
import { getProspectById, updateProspect } from '@/lib/prospects/service'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params

  try {
    const result = await getProspectById(auth.admin, id)
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    trackError(error, { route: 'GET /api/admin/prospects/[id]' })
    return NextResponse.json({ error: 'Failed to load prospect' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const parsed = await parseJsonBody(request, updateProspectSchema)
  if (!parsed.success) return parsed.response

  try {
    const prospect = await updateProspect(auth.admin, id, parsed.data, auth.user.id)
    return NextResponse.json({ prospect })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    trackError(error, { route: 'PATCH /api/admin/prospects/[id]' })
    const status = message.includes('לא מורשה') || message.includes('not found')
      ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
