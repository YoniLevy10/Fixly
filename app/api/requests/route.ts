import { NextResponse } from 'next/server'
import {
  createRequest,
  listRequests,
  listRequestsByCustomer,
  listRequestsByProfessional,
} from '@/lib/data/request-store'
import {
  supabaseCreateRequest,
  supabaseListRequests,
} from '@/lib/data/supabase-requests'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CreateRequestInput } from '@/mock/requests'
import { getClientIp, rateLimit } from '@/lib/api/rate-limit'

async function resolveProfessionalIdFromAuth(): Promise<string | undefined> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return undefined

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return undefined

  const metaId = user.user_metadata?.professional_id as string | undefined
  if (metaId) return metaId

  const { data: pro } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return pro?.id
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  let customerId = searchParams.get('customerId') ?? undefined
  let professionalId = searchParams.get('professionalId') ?? undefined
  const scope = searchParams.get('scope')
  const limit = Math.min(Number(searchParams.get('limit') ?? 0) || 0, 50)
  const offset = Math.max(Number(searchParams.get('offset') ?? 0) || 0, 0)

  if (scope === 'mine') {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } }
    if (user) customerId = user.id
  }

  if (scope === 'pro') {
    professionalId = (await resolveProfessionalIdFromAuth()) ?? professionalId
  }

  const backend = resolveDataBackend()

  if (backend === 'supabase') {
    const fromSupabase = await supabaseListRequests(
      { customerId, professionalId },
      limit > 0 ? { limit: limit + 1, offset } : undefined
    )
    const rows = fromSupabase ?? []
    if (limit > 0) {
      const hasMore = rows.length > limit
      const items = hasMore ? rows.slice(0, limit) : rows
      return NextResponse.json({ items, hasMore, offset })
    }
    return NextResponse.json(rows)
  }

  if (backend === 'mock') {
    let data = listRequests()
    if (customerId) data = listRequestsByCustomer(customerId)
    if (professionalId) data = listRequestsByProfessional(professionalId)
    if (limit > 0) {
      const slice = data.slice(offset, offset + limit + 1)
      const hasMore = slice.length > limit
      const items = hasMore ? slice.slice(0, limit) : slice
      return NextResponse.json({ items, hasMore, offset })
    }
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'No data backend' }, { status: 503 })
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limited = rateLimit(`requests-post:${ip}`, 30, 60_000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'יותר מדי בקשות — נסה שוב בעוד דקה' },
      {
        status: 429,
        headers: { 'Retry-After': String(limited.retryAfterSec ?? 60) },
      }
    )
  }

  try {
    const body = (await request.json()) as CreateRequestInput
    if (!body.description || !body.professionalId) {
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 })
    }

    const backend = resolveDataBackend()

    if (backend === 'supabase') {
      const fromSupabase = await supabaseCreateRequest(body)
      if (fromSupabase) {
        return NextResponse.json(fromSupabase, { status: 201 })
      }
      return NextResponse.json({ error: 'יש להתחבר כדי לשלוח בקשה' }, { status: 401 })
    }

    if (backend === 'mock') {
      const created = createRequest({
        ...body,
        customerId: body.customerId || 'guest@fixly.app',
        customerName: body.customerName || 'אורח',
      })
      return NextResponse.json(created, { status: 201 })
    }

    return NextResponse.json({ error: 'No data backend' }, { status: 503 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת בקשה' }, { status: 500 })
  }
}
