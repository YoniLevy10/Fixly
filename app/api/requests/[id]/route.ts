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
import { canTransition } from '@/lib/guards/request-transition'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { updateRequestSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'
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
  const limited = await enforceRateLimit(request, 'requests-patch', 60, 60_000)
  if (limited) return limited

  const { id } = await context.params

  try {
    const parsed = await parseJsonBody(request, updateRequestSchema)
    if (!parsed.success) return parsed.response

    const { status, quotedAmount, cancellationReason } = parsed.data
    const backend = resolveDataBackend()
    let billing: {
      leadCharged?: boolean
      amountAgorot?: number
      commissionAgorot?: number
    } = {}

    if (backend === 'supabase') {
      const existing = await supabaseGetRequestById(id)
      if (!existing) {
        return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
      }

      if (!canTransition(existing.status as RequestStatus, status)) {
        return NextResponse.json(
          { error: `מעבר סטטוס לא חוקי: ${existing.status} → ${status}` },
          { status: 409 },
        )
      }

      const fromSupabase = await supabaseUpdateRequest(id, status, {
        quotedAmount,
        cancellationReason,
      })
      if (fromSupabase) {
        if (featureFlags.monetization && existing.professionalId) {
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
              quotedAmount,
            )
            billing = { ...billing, commissionAgorot: commission }
          }
        }
        return NextResponse.json({ ...fromSupabase, billing })
      }
      return NextResponse.json({ error: 'לא נמצא או אין הרשאה' }, { status: 404 })
    }

    if (backend === 'mock') {
      const existing = getRequestById(id)
      if (existing && !canTransition(existing.status as RequestStatus, status)) {
        return NextResponse.json(
          { error: `מעבר סטטוס לא חוקי: ${existing.status} → ${status}` },
          { status: 409 },
        )
      }

      const updated = updateRequestStatus(id, status, {
        cancellationReason,
      })
      if (!updated) {
        return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
      }
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'No data backend' }, { status: 503 })
  } catch (error) {
    trackError(error, { route: 'PATCH /api/requests/[id]' })
    return NextResponse.json({ error: 'שגיאה בעדכון בקשה' }, { status: 500 })
  }
}
