import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mapRequestRow } from '@/lib/data/supabase-mappers'
import type { MockRequest, CreateRequestInput } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'

const REQUEST_SELECT = `
  id,
  customer_id,
  professional_id,
  category_id,
  title,
  description,
  address,
  city,
  status,
  created_at,
  professionals ( title ),
  users ( full_name, phone ),
  service_categories ( name, name_he )
`

export async function supabaseListRequests(
  filters?: {
    customerId?: string
    professionalId?: string
  },
  pagination?: { limit: number; offset: number }
): Promise<MockRequest[] | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  let query = supabase
    .from('requests')
    .select(REQUEST_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }
  if (filters?.professionalId) {
    query = query.eq('professional_id', filters.professionalId)
  }
  if (pagination) {
    query = query.range(
      pagination.offset,
      pagination.offset + pagination.limit - 1
    )
  }

  const { data, error } = await query
  if (error) {
    console.error('[supabase] list requests', error.message)
    return null
  }

  return (data ?? []).map((row) => mapRequestRow(row))
}

export async function supabaseGetRequestById(
  id: string
): Promise<MockRequest | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('requests')
    .select(REQUEST_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return mapRequestRow(data)
}

export async function supabaseCreateRequest(
  input: CreateRequestInput
): Promise<MockRequest | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pro } = await supabase
    .from('professionals')
    .select('category_id')
    .eq('id', input.professionalId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('requests')
    .insert({
      customer_id: user.id,
      professional_id: input.professionalId,
      category_id: pro?.category_id ?? null,
      title: input.title ?? input.description.slice(0, 80),
      description: input.description,
      address: input.location,
      status: 'pending',
    })
    .select(REQUEST_SELECT)
    .single()

  if (error || !data) {
    console.error('[supabase] create request', error?.message)
    return null
  }

  if (input.images?.length) {
    await supabase.from('request_images').insert(
      input.images.map((url) => ({
        request_id: data.id,
        image_url: url,
      }))
    )
  }

  return mapRequestRow(data)
}

export async function supabaseUpdateRequest(
  id: string,
  status: RequestStatus,
  extra?: { quotedAmount?: number }
): Promise<MockRequest | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const patch: Record<string, unknown> = { status }
  if (extra?.quotedAmount != null) {
    patch.quoted_amount = extra.quotedAmount
  }

  const { data, error } = await supabase
    .from('requests')
    .update(patch)
    .eq('id', id)
    .select(REQUEST_SELECT)
    .single()

  if (error || !data) {
    console.error('[supabase] update request', error?.message)
    return null
  }

  return mapRequestRow(data)
}
