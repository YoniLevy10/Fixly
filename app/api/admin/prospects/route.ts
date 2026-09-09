import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { parseJsonBody } from '@/lib/api/parse-body'
import { createProspectSchema } from '@/lib/api/schemas'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { ManualProspectAdapter } from '@/lib/prospects/adapters/manual'
import {
  getProspectCounters,
  ingestFromAdapter,
  listProspects,
} from '@/lib/prospects/service'
import type { FitClass, ProspectStatus } from '@/lib/prospects/types'
import { FIT_CLASSES, PROSPECT_STATUSES } from '@/lib/prospects/types'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? undefined
    const statusParam = url.searchParams.get('status')
    const categoryId = url.searchParams.get('categoryId') ?? undefined
    const sourceName = url.searchParams.get('sourceName') ?? undefined
    const city = url.searchParams.get('city') ?? undefined
    const fitClassParam = url.searchParams.get('fitClass') ?? undefined
    const contactability =
      (url.searchParams.get('contactability') as
        | 'mobile'
        | 'landline'
        | 'unknown'
        | 'none'
        | null) ?? undefined
    const limit = Number(url.searchParams.get('limit') ?? 50)
    const offset = Number(url.searchParams.get('offset') ?? 0)

    let status: ProspectStatus | ProspectStatus[] | undefined
    if (statusParam) {
      const parts = statusParam.split(',').map((s) => s.trim())
      const valid = parts.filter((s): s is ProspectStatus =>
        (PROSPECT_STATUSES as readonly string[]).includes(s),
      )
      if (valid.length === 1) status = valid[0]
      else if (valid.length > 1) status = valid
    }

    let fitClass: FitClass | FitClass[] | undefined
    if (fitClassParam) {
      const parts = fitClassParam.split(',').map((s) => s.trim())
      const valid = parts.filter((s): s is FitClass =>
        (FIT_CLASSES as readonly string[]).includes(s),
      )
      if (valid.length === 1) fitClass = valid[0]
      else if (valid.length > 1) fitClass = valid
    }

    const [list, counters] = await Promise.all([
      listProspects(auth.admin, {
        q,
        status,
        categoryId,
        sourceName,
        city,
        fitClass,
        contactability: contactability || undefined,
        limit: Number.isFinite(limit) ? limit : 50,
        offset: Number.isFinite(offset) ? offset : 0,
      }),
      getProspectCounters(auth.admin),
    ])

    return NextResponse.json({
      items: list.items,
      total: list.total,
      counters,
    })
  } catch (error) {
    trackError(error, { route: 'GET /api/admin/prospects' })
    return NextResponse.json({ error: 'Failed to list prospects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'admin-prospects-create', 30, 60_000)
  if (limited) return limited

  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, createProspectSchema)
  if (!parsed.success) return parsed.response

  try {
    const adapter = new ManualProspectAdapter(parsed.data)
    const result = await ingestFromAdapter(auth.admin, adapter, auth.user.id)

    if (result.created.length === 0 && result.skipped.length > 0) {
      return NextResponse.json(
        {
          error: 'כפילות — הליד כבר קיים',
          skipped: result.skipped,
        },
        { status: 409 },
      )
    }

    if (result.created.length === 0) {
      return NextResponse.json(
        {
          error: result.errors[0]?.error ?? 'יצירה נכשלה',
          errors: result.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { prospect: result.created[0], skipped: result.skipped, errors: result.errors },
      { status: 201 },
    )
  } catch (error) {
    trackError(error, { route: 'POST /api/admin/prospects' })
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}
