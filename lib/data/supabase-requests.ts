import { getSupabaseClient } from '@/lib/supabase/client'
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
  service_categories ( name )
`

export async function supabaseListRequests(filters?: {
  customerId?: string
  professionalId?: string
}): Promise<MockRequest[] | null> {
  const supabase = getSupabaseClient()
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
  const supabase = getSupabaseClient()
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
  const supabase = getSupabaseClient()
  if (!supabase) return null

  let categoryId: string | null = null
  const { data: pro } = await supabase
    .from('professionals')
    .select('category_id')
    .eq('id', input.professionalId)
    .maybeSingle()

  categoryId = pro?.category_id ?? null

  const { data, error } = await supabase
    .from('requests')
    .insert({
      customer_id: input.customerId,
      professional_id: input.professionalId,
      category_id: categoryId,
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
  _extra?: Partial<MockRequest>
): Promise<MockRequest | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', id)
    .select(REQUEST_SELECT)
    .single()

  if (error || !data) {
    console.error('[supabase] update request', error?.message)
    return null
  }

  return mapRequestRow(data)
}
