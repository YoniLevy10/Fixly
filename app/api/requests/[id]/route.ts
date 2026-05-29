import { NextResponse } from 'next/server'
import { getRequestById, updateRequestStatus } from '@/lib/data/request-store'
import {
  supabaseGetRequestById,
  supabaseUpdateRequest,
} from '@/lib/data/supabase-requests'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
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

  if (!status) {
    return NextResponse.json({ error: 'סטטוס חסר' }, { status: 400 })
  }

  const backend = resolveDataBackend()

  if (backend === 'supabase') {
    const fromSupabase = await supabaseUpdateRequest(id, status)
    if (fromSupabase) return NextResponse.json(fromSupabase)
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
