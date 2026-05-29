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
import type { CreateRequestInput } from '@/mock/requests'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId') ?? undefined
  const professionalId = searchParams.get('professionalId') ?? undefined

  const fromSupabase = await supabaseListRequests({ customerId, professionalId })
  if (fromSupabase) {
    return NextResponse.json(fromSupabase)
  }

  let data = listRequests()
  if (customerId) data = listRequestsByCustomer(customerId)
  if (professionalId) data = listRequestsByProfessional(professionalId)

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRequestInput
    if (!body.description || !body.professionalId || !body.customerId) {
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 })
    }

    const fromSupabase = await supabaseCreateRequest(body)
    if (fromSupabase) {
      return NextResponse.json(fromSupabase, { status: 201 })
    }

    const created = createRequest(body)
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת בקשה' }, { status: 500 })
  }
}
