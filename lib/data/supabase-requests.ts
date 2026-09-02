import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { mapRequestRow } from '@/lib/data/supabase-mappers'
import { coordsFromLocationText } from '@/lib/tracking/geo'
import { findMatchingCandidates } from '@/lib/matching/find-candidates'
import { notifyInvitedProfessionals } from '@/lib/push/notify-invited-professionals'
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
  match_mode,
  preferred_date,
  preferred_time,
  quoted_amount,
  payment_status,
  paid_at,
  referral_code,
  destination_lat,
  destination_lng,
  pro_lat,
  pro_lng,
  pro_location_updated_at,
  live_tracking_active,
  professionals ( title, phone, whatsapp_number ),
  users ( full_name, phone ),
  service_categories ( name, name_he, slug )
`

function parseCityFromLocation(location?: string): string | null {
  if (!location) return null
  const parts = location.split(',').map((p) => p.trim())
  return parts[parts.length - 1] || location
}

export async function supabaseListRequests(
  filters?: {
    customerId?: string
    professionalId?: string
    includeInvites?: boolean
  },
  pagination?: { limit: number; offset: number },
): Promise<MockRequest[] | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const results: MockRequest[] = []

  if (filters?.customerId || (!filters?.professionalId && !filters?.includeInvites)) {
    let query = supabase
      .from('requests')
      .select(REQUEST_SELECT)
      .order('created_at', { ascending: false })

    if (filters?.customerId) query = query.eq('customer_id', filters.customerId)
    if (filters?.professionalId) query = query.eq('professional_id', filters.professionalId)

    if (pagination) {
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1)
    }

    const { data, error } = await query
    if (error) {
      console.error('[supabase] list requests', error.message)
      return null
    }
    results.push(...(data ?? []).map((row) => mapRequestRow(row)))
  }

  if (filters?.professionalId && filters.includeInvites) {
    const { data: invites } = await supabase
      .from('request_candidates')
      .select(`status, rank, requests (${REQUEST_SELECT})`)
      .eq('professional_id', filters.professionalId)
      .eq('status', 'invited')

    for (const inv of invites ?? []) {
      const req = inv.requests as unknown as Record<string, unknown>
      if (req && typeof req === 'object' && 'id' in req) {
        const mapped = mapRequestRow(req as Parameters<typeof mapRequestRow>[0])
        mapped.status = 'pending'
        results.push(mapped)
      }
    }
  }

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function supabaseGetRequestById(id: string): Promise<MockRequest | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('requests')
    .select(REQUEST_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const mapped = mapRequestRow(data)

  if (mapped.matchMode === 'multi' && !mapped.professionalId) {
    const { data: candidates } = await supabase
      .from('request_candidates')
      .select('professional_id, rank, status, professionals(title, rating)')
      .eq('request_id', id)
      .order('rank')

    mapped.candidates = (candidates ?? []).map((c) => {
      const pro = c.professionals as { title?: string; rating?: number } | null
      return {
        professionalId: c.professional_id as string,
        rank: c.rank as number,
        name: pro?.title ?? 'Pro',
        rating: Number(pro?.rating ?? 0),
        status: c.status as string,
      }
    })
  }

  return mapped
}

export async function supabaseCreateRequest(
  input: CreateRequestInput,
): Promise<MockRequest | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const isMulti = input.matchMode === true || !input.professionalId
  let categoryId: string | null = input.categoryId ?? null

  if (!isMulti && input.professionalId) {
    const { data: pro } = await supabase
      .from('professionals')
      .select('category_id')
      .eq('id', input.professionalId)
      .maybeSingle()
    categoryId = pro?.category_id ?? categoryId
  }

  if (isMulti && input.categorySlug && !categoryId) {
    const { data: cat } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', input.categorySlug)
      .maybeSingle()
    categoryId = cat?.id ?? null
  }

  const coords =
    input.destinationLat != null && input.destinationLng != null
      ? { lat: input.destinationLat, lng: input.destinationLng }
      : coordsFromLocationText(input.location)

  const city = input.city ?? parseCityFromLocation(input.location)

  const { data, error } = await supabase
    .from('requests')
    .insert({
      customer_id: user.id,
      professional_id: isMulti ? null : input.professionalId,
      category_id: categoryId,
      title: input.title ?? input.description.slice(0, 80),
      description: input.description,
      address: input.location,
      city,
      status: 'pending',
      match_mode: isMulti ? 'multi' : 'single',
      preferred_date: input.preferredDate || null,
      preferred_time: input.preferredTime || null,
      referral_code: input.referralCode || null,
      destination_lat: coords.lat,
      destination_lng: coords.lng,
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
      })),
    )
  }

  const mapped = mapRequestRow(data)

  if (isMulti) {
    const candidates = await findMatchingCandidates({
      categoryId,
      city,
      limit: 3,
    })

    if (candidates.length) {
      // Service-role insert — no public INSERT policy on request_candidates (RLS)
      const admin = getAdminSupabaseClient() ?? supabase
      const { error: candidateError } = await admin.from('request_candidates').insert(
        candidates.map((c) => ({
          request_id: data.id,
          professional_id: c.professionalId,
          rank: c.rank,
          status: 'invited',
        })),
      )
      if (candidateError) {
        console.error('[supabase] request_candidates insert', candidateError.message)
      } else {
        mapped.candidates = candidates
        void notifyInvitedProfessionals(
          data.id as string,
          (data.title as string) || mapped.title || 'בקשה חדשה',
          candidates,
        )
      }
    }
  }

  return mapped
}

export async function supabaseUpdateProLocation(
  requestId: string,
  lat: number,
  lng: number,
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('requests')
    .update({
      pro_lat: lat,
      pro_lng: lng,
      pro_location_updated_at: new Date().toISOString(),
      live_tracking_active: true,
    })
    .eq('id', requestId)

  return !error
}

export async function supabaseUpdateRequest(
  id: string,
  status: RequestStatus,
  extra?: { quotedAmount?: number; cancellationReason?: string },
): Promise<MockRequest | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const patch: Record<string, unknown> = { status }
  if (extra?.quotedAmount != null) {
    patch.quoted_amount = extra.quotedAmount
  }
  if (extra?.cancellationReason != null) {
    patch.cancellation_reason = extra.cancellationReason
  }
  if (status === 'accepted') {
    patch.accepted_at = new Date().toISOString()
  }
  if (status === 'on_the_way') {
    patch.live_tracking_active = true
  }
  if (status === 'completed' || status === 'cancelled') {
    patch.live_tracking_active = false
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
