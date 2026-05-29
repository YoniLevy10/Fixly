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
    const fromSupabase = await supabaseListRequests({ customerId, professionalId })
    return NextResponse.json(fromSupabase ?? [])
  }

  if (backend === 'mock') {
    let data = listRequests()
    if (customerId) data = listRequestsByCustomer(customerId)
    if (professionalId) data = listRequestsByProfessional(professionalId)
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'No data backend' }, { status: 503 })
}

export async function POST(request: Request) {
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
