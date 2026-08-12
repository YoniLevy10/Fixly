import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { findMatchingCandidates } from '@/lib/matching/find-candidates'
import { normalizeCategoryKey } from './categories'
import { toApiStatus, toFixlyStatus, canTransitionApi } from './status-map'
import { emitJobStatusWebhook } from './webhook'
import { assignmentModeToMatchMode } from './assignment'
import {
  memoryAcceptOffer,
  memoryCreateJob,
  memoryGetJob,
  memoryListProviders,
  memoryUpdateStatus,
} from './memory-store'
import { sendPushToUser } from '@/lib/push/send'
import type {
  CreateJobInput,
  ExternalRef,
  JobApiStatus,
  JobView,
  WebhookPayload,
  WebhookProvider,
} from './types'

async function providerFromJob(
  job: JobView,
  providerId?: string | null,
): Promise<WebhookProvider | null> {
  const id = providerId ?? job.assigned_provider_id
  if (!id) return null
  const offer = job.offers.find((o) => o.provider_id === id)
  const name = offer?.provider_name ?? 'Pro'

  let phone: string | null = null
  if (useMemoryFallback()) {
    phone = memoryListProviders().find((p) => p.id === id)?.phone ?? null
  } else {
    const admin = getAdminSupabaseClient()
    if (admin) {
      const { data: pro } = await admin
        .from('professionals')
        .select('phone, whatsapp_number')
        .eq('id', id)
        .maybeSingle()
      phone = (pro?.whatsapp_number as string | null) ?? (pro?.phone as string | null) ?? null
    }
  }

  return {
    id,
    name,
    phone,
    category: job.category,
  }
}

/** Notify invited professionals about a new Bamakor/partner job */
async function notifyInvitedProfessionals(
  requestId: string,
  title: string,
  candidates: { professionalId: string }[],
) {
  const admin = getAdminSupabaseClient()
  if (!admin) return

  for (const candidate of candidates) {
    try {
      const { data: pro } = await admin
        .from('professionals')
        .select('user_id, phone, title')
        .eq('id', candidate.professionalId)
        .maybeSingle()

      if (pro?.user_id) {
        await sendPushToUser(pro.user_id as string, {
          title: 'עבודה חדשה מ-Fixly! 🛠',
          body: title,
          url: `/pro/requests/${requestId}`,
          tag: `job-${requestId}`,
        })
      }
    } catch (err) {
      console.error('[push notification failed]', candidate.professionalId, err)
    }
  }
}

function useMemoryFallback(): boolean {
  if (process.env.FIXLY_JOBS_STORE === 'memory') return true
  if (!getAdminSupabaseClient()) return true
  return false
}

async function resolveCategoryId(
  slugOrKey: string,
): Promise<{ id: string; slug: string } | null> {
  const slug = normalizeCategoryKey(slugOrKey)
  if (!slug) return null
  const admin = getAdminSupabaseClient()
  if (!admin) return null
  const { data } = await admin
    .from('service_categories')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  return { id: data.id as string, slug: data.slug as string }
}

function rowToExternalRef(row: Record<string, unknown>): ExternalRef | null {
  if (!row.external_system || !row.external_ticket_id) return null
  return {
    system: String(row.external_system),
    ticket_id: String(row.external_ticket_id),
    ticket_number: (row.external_ticket_number as number | null) ?? null,
    client_id: (row.external_client_id as string | null) ?? null,
    client_name: (row.external_client_name as string | null) ?? null,
  }
}

async function loadOffers(requestId: string) {
  const admin = getAdminSupabaseClient()!
  const { data } = await admin
    .from('request_candidates')
    .select('id, professional_id, status, invited_at, responded_at, professionals(title)')
    .eq('request_id', requestId)
    .order('rank')

  return (data ?? []).map((o) => {
    const pro = o.professionals as { title?: string } | null
    return {
      offer_id: o.id as string,
      provider_id: o.professional_id as string,
      provider_name: pro?.title ?? 'Pro',
      status: o.status as string,
      offered_at: o.invited_at as string,
      responded_at: (o.responded_at as string | null) ?? null,
    }
  })
}

async function loadEvents(requestId: string) {
  const admin = getAdminSupabaseClient()!
  const { data } = await admin
    .from('request_events')
    .select('id, status, event_type, payload_json, created_at')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  return (data ?? []).map((e) => ({
    id: e.id as string,
    status: e.status as string,
    event_type: e.event_type as string,
    created_at: e.created_at as string,
    payload: (e.payload_json as Record<string, unknown>) ?? {},
  }))
}

async function mapRowToJobView(row: Record<string, unknown>): Promise<JobView> {
  const offers = await loadOffers(row.id as string)
  const events = await loadEvents(row.id as string).catch(() => [])
  const matched = Number(row.matched_providers_count ?? offers.length)
  const hasOpen = offers.some((o) => o.status === 'invited')
  const cat = row.service_categories as { slug?: string } | null

  return {
    job_id: row.id as string,
    status: toApiStatus(String(row.status), {
      matchedProviders: matched,
      hasOpenOffers: hasOpen,
    }),
    category: cat?.slug ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    priority: (row.priority as JobView['priority']) ?? 'medium',
    location: {
      building_name: (row.building_name as string | null) ?? null,
      address: (row.address as string | null) ?? null,
      city: (row.city as string) ?? '',
      lat: row.destination_lat != null ? Number(row.destination_lat) : null,
      lng: row.destination_lng != null ? Number(row.destination_lng) : null,
    },
    contact: {
      reporter_phone: (row.reporter_phone as string | null) ?? null,
      manager_phone: (row.manager_phone as string | null) ?? null,
      notes: (row.manager_notes as string | null) ?? null,
    },
    source: String(row.source ?? 'fixly'),
    external_ref: rowToExternalRef(row),
    assignment_mode:
      (row.assignment_mode as JobView['assignment_mode']) ?? 'broadcast_first_accept',
    matched_providers: matched,
    callback_url: (row.callback_url as string | null) ?? null,
    assigned_provider_id: (row.professional_id as string | null) ?? null,
    offers,
    events,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

const JOB_SELECT = `
  id, title, description, status, priority, source, city, address, building_name,
  reporter_phone, manager_phone, manager_notes, callback_url, assignment_mode,
  external_system, external_ticket_id, external_ticket_number, external_client_id,
  external_client_name, matched_providers_count, professional_id, destination_lat,
  destination_lng, media_urls, created_at, updated_at, category_id,
  service_categories ( slug )
`

async function recordEvent(
  requestId: string,
  status: string,
  payload: Record<string, unknown>,
  webhook?: { delivered: boolean; httpStatus: number | null; error: string | null },
) {
  const admin = getAdminSupabaseClient()
  if (!admin) return
  try {
    await admin.from('request_events').insert({
      request_id: requestId,
      status,
      event_type: 'status_changed',
      payload_json: payload,
      webhook_delivered: webhook?.delivered ?? null,
      webhook_http_status: webhook?.httpStatus ?? null,
      webhook_error: webhook?.error ?? null,
    })
  } catch (err) {
    console.error('[request_events] insert failed', err)
  }
}

async function maybeEmit(
  job: JobView,
  previousStatus: JobApiStatus | null,
  extra?: Record<string, unknown>,
) {
  const payload: WebhookPayload = {
    event: 'job.status_changed',
    job_id: job.job_id,
    status: job.status,
    previous_status: previousStatus,
    external_ref: job.external_ref,
    provider: await providerFromJob(job),
    occurred_at: new Date().toISOString(),
    payload: extra,
  }

  const result = await emitJobStatusWebhook({
    callbackUrl: job.callback_url,
    payload,
  })

  await recordEvent(job.job_id, job.status, { ...payload, ...extra }, {
    delivered: result.delivered,
    httpStatus: result.httpStatus,
    error: result.error,
  })

  return result
}

export async function createJob(
  input: CreateJobInput,
): Promise<{ job: JobView; webhookDryRun: boolean }> {
  if (useMemoryFallback()) {
    const job = memoryCreateJob(input)
    for (const offer of job.offers) {
      console.log(
        '[memory] notify invited provider',
        offer.provider_id,
        offer.provider_name,
        `job=${job.job_id}`,
        input.title,
      )
    }
    const result = await emitJobStatusWebhook({
      callbackUrl: job.callback_url,
      payload: {
        event: 'job.status_changed',
        job_id: job.job_id,
        status: job.status,
        previous_status: null,
        external_ref: job.external_ref,
        provider: null,
        occurred_at: new Date().toISOString(),
        payload: { matched_providers: job.matched_providers },
      },
    })
    return { job, webhookDryRun: result.dryRun }
  }

  const admin = getAdminSupabaseClient()!
  const category = await resolveCategoryId(input.category)
  if (!category) {
    throw new Error(`Unknown category: ${input.category}`)
  }

  if (input.external_ref?.ticket_id) {
    const { data: existing } = await admin
      .from('requests')
      .select(JOB_SELECT)
      .eq('external_system', input.external_ref.system)
      .eq('external_ticket_id', input.external_ref.ticket_id)
      .maybeSingle()
    if (existing) {
      const job = await mapRowToJobView(existing as Record<string, unknown>)
      return { job, webhookDryRun: true }
    }
  }

  const assignmentMode = input.assignment_mode ?? 'broadcast_first_accept'
  const candidates = await findMatchingCandidates({
    categoryId: category.id,
    city: input.location.city,
    limit: 5,
    preferAdmin: true,
  })

  const status = candidates.length === 0 ? 'no_providers' : 'pending'

  const { data, error } = await admin
    .from('requests')
    .insert({
      customer_id: null,
      professional_id: null,
      category_id: category.id,
      title: input.title,
      description: input.description,
      address: input.location.address ?? input.location.building_name ?? null,
      city: input.location.city,
      status,
      match_mode: assignmentModeToMatchMode(assignmentMode),
      source: input.source ?? 'bamakor',
      external_system: input.external_ref?.system ?? null,
      external_ticket_id: input.external_ref?.ticket_id ?? null,
      external_ticket_number: input.external_ref?.ticket_number ?? null,
      external_client_id: input.external_ref?.client_id ?? null,
      external_client_name: input.external_ref?.client_name ?? null,
      building_name: input.location.building_name ?? null,
      reporter_phone: input.contact?.reporter_phone ?? null,
      manager_phone: input.contact?.manager_phone ?? null,
      manager_notes: input.contact?.notes ?? null,
      callback_url: input.callback_url ?? null,
      assignment_mode: assignmentMode,
      priority: input.priority ?? 'medium',
      media_urls: input.media_urls ?? [],
      matched_providers_count: candidates.length,
      destination_lat: input.location.lat ?? null,
      destination_lng: input.location.lng ?? null,
    })
    .select(JOB_SELECT)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create job')
  }

  if (candidates.length) {
    await admin.from('request_candidates').insert(
      candidates.map((c) => ({
        request_id: data.id,
        professional_id: c.professionalId,
        rank: c.rank,
        status: 'invited',
      })),
    )
    await notifyInvitedProfessionals(data.id as string, input.title, candidates)
  }

  const job = await mapRowToJobView(data as Record<string, unknown>)
  const webhook = await maybeEmit(job, null, { matched_providers: job.matched_providers })
  return { job, webhookDryRun: webhook.dryRun }
}

export async function getJob(jobId: string): Promise<JobView | null> {
  if (useMemoryFallback()) {
    return memoryGetJob(jobId)
  }
  const admin = getAdminSupabaseClient()!
  const { data } = await admin.from('requests').select(JOB_SELECT).eq('id', jobId).maybeSingle()
  if (!data) return null
  return mapRowToJobView(data as Record<string, unknown>)
}

export async function acceptJobOffer(
  jobId: string,
  providerId: string,
): Promise<{ job: JobView; webhook: Awaited<ReturnType<typeof emitJobStatusWebhook>> }> {
  if (useMemoryFallback()) {
    const prev = memoryGetJob(jobId)
    const job = memoryAcceptOffer(jobId, providerId)
    if (!job) throw new Error('Job not found')
    const webhook = await emitJobStatusWebhook({
      callbackUrl: job.callback_url,
      payload: {
        event: 'job.status_changed',
        job_id: job.job_id,
        status: job.status,
        previous_status: prev?.status ?? null,
        external_ref: job.external_ref,
        provider: await providerFromJob(job, providerId),
        occurred_at: new Date().toISOString(),
      },
    })
    return { job, webhook }
  }

  const admin = getAdminSupabaseClient()!
  const existing = await getJob(jobId)
  if (!existing) throw new Error('Job not found')
  if (existing.assigned_provider_id) throw new Error('Already assigned')
  if (!['open', 'offered'].includes(existing.status)) {
    throw new Error('Job not open for accept')
  }

  const { data: candidate } = await admin
    .from('request_candidates')
    .select('id')
    .eq('request_id', jobId)
    .eq('professional_id', providerId)
    .eq('status', 'invited')
    .maybeSingle()

  if (!candidate) throw new Error('No invite for provider')

  const now = new Date().toISOString()
  await admin
    .from('requests')
    .update({
      professional_id: providerId,
      status: 'accepted',
      accepted_at: now,
    })
    .eq('id', jobId)
    .is('professional_id', null)

  await admin
    .from('request_candidates')
    .update({ status: 'accepted', responded_at: now })
    .eq('id', candidate.id)

  await admin
    .from('request_candidates')
    .update({ status: 'expired', responded_at: now })
    .eq('request_id', jobId)
    .neq('id', candidate.id)
    .eq('status', 'invited')

  const job = await getJob(jobId)
  if (!job) throw new Error('Job missing after accept')
  const webhook = await maybeEmit(job, existing.status, { provider_id: providerId })
  return { job, webhook }
}

export async function updateJobStatus(
  jobId: string,
  apiStatus: JobApiStatus,
  opts?: { note?: string },
): Promise<{ job: JobView; webhook: Awaited<ReturnType<typeof emitJobStatusWebhook>> }> {
  if (useMemoryFallback()) {
    const prev = memoryGetJob(jobId)
    if (!prev) throw new Error('Job not found')
    if (!canTransitionApi(prev.status, apiStatus) && apiStatus !== prev.status) {
      throw new Error(`Invalid transition ${prev.status} → ${apiStatus}`)
    }
    const job = memoryUpdateStatus(jobId, apiStatus)
    if (!job) throw new Error('Job not found')
    const webhook = await emitJobStatusWebhook({
      callbackUrl: job.callback_url,
      payload: {
        event: 'job.status_changed',
        job_id: job.job_id,
        status: job.status,
        previous_status: prev.status,
        external_ref: job.external_ref,
        provider: await providerFromJob(job),
        occurred_at: new Date().toISOString(),
        payload: opts?.note ? { note: opts.note } : {},
      },
    })
    return { job, webhook }
  }

  const existing = await getJob(jobId)
  if (!existing) throw new Error('Job not found')
  if (!canTransitionApi(existing.status, apiStatus)) {
    throw new Error(`Invalid transition ${existing.status} → ${apiStatus}`)
  }

  const fixlyStatus = toFixlyStatus(apiStatus)
  const admin = getAdminSupabaseClient()!
  const patch: Record<string, unknown> = { status: fixlyStatus }
  if (apiStatus === 'accepted') patch.accepted_at = new Date().toISOString()
  if (apiStatus === 'en_route') patch.live_tracking_active = true
  if (apiStatus === 'completed' || apiStatus === 'cancelled') {
    patch.live_tracking_active = false
  }

  const { error } = await admin.from('requests').update(patch).eq('id', jobId)
  if (error) throw new Error(error.message)

  const job = await getJob(jobId)
  if (!job) throw new Error('Job missing after update')
  const webhook = await maybeEmit(job, existing.status, opts?.note ? { note: opts.note } : {})
  return { job, webhook }
}

/** Cancel job (partner API) — emits `cancelled` webhook */
export async function cancelJob(
  jobId: string,
  opts?: { reason?: string },
): Promise<{ job: JobView; webhook: Awaited<ReturnType<typeof emitJobStatusWebhook>> }> {
  const existing = useMemoryFallback() ? memoryGetJob(jobId) : await getJob(jobId)
  if (!existing) throw new Error('Job not found')
  if (existing.status === 'cancelled') {
    throw new Error('Job already cancelled')
  }
  if (['completed', 'expired'].includes(existing.status)) {
    throw new Error(`Invalid transition ${existing.status} → cancelled`)
  }
  const result = await updateJobStatus(jobId, 'cancelled', { note: opts?.reason })

  if (!useMemoryFallback()) {
    const admin = getAdminSupabaseClient()
    if (admin) {
      await admin
        .from('request_candidates')
        .update({ status: 'expired', responded_at: new Date().toISOString() })
        .eq('request_id', jobId)
        .eq('status', 'invited')
    }
  }

  return result
}

/** Called from consumer accept / PATCH paths when request has callback_url */
export async function emitWebhookForRequestId(
  requestId: string,
  previousApiStatus: JobApiStatus | null,
) {
  const job = await getJob(requestId)
  if (!job?.callback_url) return null
  return maybeEmit(job, previousApiStatus)
}
