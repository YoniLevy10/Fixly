import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { exportProspectsCsv } from '@/lib/prospects/service'
import type { ProspectStatus } from '@/lib/prospects/types'
import { PROSPECT_STATUSES } from '@/lib/prospects/types'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const statusParam = url.searchParams.get('status')
    let status: ProspectStatus | undefined
    if (
      statusParam &&
      (PROSPECT_STATUSES as readonly string[]).includes(statusParam)
    ) {
      status = statusParam as ProspectStatus
    }

    const csv = await exportProspectsCsv(auth.admin, {
      q: url.searchParams.get('q') ?? undefined,
      status,
      categoryId: url.searchParams.get('categoryId') ?? undefined,
      sourceName: url.searchParams.get('sourceName') ?? undefined,
      city: url.searchParams.get('city') ?? undefined,
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="fixly-prospects.csv"',
      },
    })
  } catch (error) {
    trackError(error, { route: 'GET /api/admin/prospects/export' })
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
