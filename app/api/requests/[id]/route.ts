import { NextResponse } from 'next/server'
import { getRequestById, updateRequestStatus } from '@/lib/data/request-store'
import {
  supabaseGetRequestById,
  supabaseUpdateRequest,
} from '@/lib/data/supabase-requests'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { featureFlags } from '@/lib/feature-flags'
import {
  handleCommissionOnComplete,
  handleLeadOnAccept,
} from '@/lib/monetization/record-billing'
import type { RequestStatus } from '@/shared/constants/request-status'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const backend = resolveDataBackend()

  if (backend === 'supabase') {
    const fromSupabase = await supabaseGetRequestById(id)
    if (fromSupabase) return NextResponse.json(fromSupabase)
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  if (backend === 'mock') {
    const item = getRequestById(id)
    if (!item) {
      return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
    }
    return NextResponse.json(item)
  }

  return NextResponse.json({ error: 'No data backend' }, { status: 503 })
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const status = body.status as RequestStatus | undefined
  const quotedAmount =
    typeof body.quotedAmount === 'number' ? body.quotedAmount : undefined

  if (!status) {
    return NextResponse.json({ error: 'סטטוס חסר' }, { status: 400 })
  }

  const backend = resolveDataBackend()
  let billing: { leadCharged?: boolean; amountAgorot?: number; commissionAgorot?: number } =
    {}

  if (backend === 'supabase') {
    const existing = await supabaseGetRequestById(id)
    const fromSupabase = await supabaseUpdateRequest(id, status, { quotedAmount })
    if (fromSupabase) {
      if (featureFlags.monetization && existing?.professionalId) {
        if (status === 'accepted') {
          const lead = await handleLeadOnAccept(existing.professionalId, id)
          billing = {
            leadCharged: lead.charged,
            amountAgorot: lead.amountAgorot,
          }
        }
        if (status === 'completed' && quotedAmount) {
          const commission = await handleCommissionOnComplete(
            existing.professionalId,
            id,
            quotedAmount
          )
          billing = { ...billing, commissionAgorot: commission }
        }
      }
      return NextResponse.json({ ...fromSupabase, billing })
    }
    return NextResponse.json({ error: 'לא נמצא או אין הרשאה' }, { status: 404 })
  }

  if (backend === 'mock') {
    const updated = updateRequestStatus(id, status, {
      cancellationReason: body.cancellationReason,
    })
    if (!updated) {
      return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
    }
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'No data backend' }, { status: 503 })
}
