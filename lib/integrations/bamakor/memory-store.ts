import { randomUUID } from 'crypto'
import type {
  CreateJobInput,
  ExternalRef,
  JobOfferView,
  JobView,
  JobApiStatus,
} from './types'
import { toApiStatus } from './status-map'
import { normalizeCategoryKey } from './categories'
import { PHASE1_CATEGORY_SEEDS } from './categories'

type MemCategory = { id: string; slug: string; name_he: string }
type MemProvider = {
  id: string
  display_name: string
  phone: string | null
  category_slug: string
  city: string
  is_active: boolean
}
type MemOffer = {
  id: string
  job_id: string
  provider_id: string
  status: 'invited' | 'accepted' | 'declined' | 'expired'
  offered_at: string
  responded_at: string | null
}
type MemEvent = {
  id: string
  job_id: string
  status: string
  event_type: string
  payload_json: Record<string, unknown>
  created_at: string
}
type MemJob = {
  id: string
  category_slug: string
  title: string
  description: string
  priority: CreateJobInput['priority']
  status: string
  building_name: string | null
  address: string | null
  city: string
  lat: number | null
  lng: number | null
  reporter_phone: string | null
  manager_phone: string | null
  manager_notes: string | null
  source: string
  external_ref: ExternalRef | null
  assignment_mode: NonNullable<CreateJobInput['assignment_mode']>
  callback_url: string | null
  media_urls: string[]
  matched_providers_count: number
  professional_id: string | null
  created_at: string
  updated_at: string
}

const g = globalThis as unknown as {
  __fixlyJobMem?: {
    categories: MemCategory[]
    providers: MemProvider[]
    jobs: Map<string, MemJob>
    offers: MemOffer[]
    events: MemEvent[]
  }
}

function store() {
  if (!g.__fixlyJobMem) {
    g.__fixlyJobMem = {
      categories: PHASE1_CATEGORY_SEEDS.map((c) => ({
        id: randomUUID(),
        slug: c.slug,
        name_he: c.name_he,
      })),
      providers: [],
      jobs: new Map(),
      offers: [],
      events: [],
    }
  }
  return g.__fixlyJobMem
}

export function memoryReset() {
  g.__fixlyJobMem = undefined
  store()
}

export function memorySeedCategories() {
  return store().categories.map((c) => ({ ...c }))
}

export function memoryCreateProvider(input: {
  display_name: string
  phone?: string
  category: string
  city: string
}): MemProvider {
  const slug = normalizeCategoryKey(input.category)
  if (!slug) throw new Error(`Unknown category: ${input.category}`)
  const provider: MemProvider = {
    id: randomUUID(),
    display_name: input.display_name,
    phone: input.phone ?? null,
    category_slug: slug,
    city: input.city,
    is_active: true,
  }
  store().providers.push(provider)
  return provider
}

function matchProviders(categorySlug: string, city: string, limit = 5): MemProvider[] {
  const cityNorm = city.trim().toLowerCase()
  return store()
    .providers.filter(
      (p) =>
        p.is_active &&
        p.category_slug === categorySlug &&
        p.city.trim().toLowerCase().includes(cityNorm),
    )
    .slice(0, limit)
}

function toView(job: MemJob): JobView {
  const offers = store().offers.filter((o) => o.job_id === job.id)
  const hasOpen = offers.some((o) => o.status === 'invited')
  const offerViews: JobOfferView[] = offers.map((o) => {
    const pro = store().providers.find((p) => p.id === o.provider_id)
    return {
      offer_id: o.id,
      provider_id: o.provider_id,
      provider_name: pro?.display_name ?? 'Pro',
      status: o.status,
      offered_at: o.offered_at,
      responded_at: o.responded_at,
    }
  })
  const events = store()
    .events.filter((e) => e.job_id === job.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((e) => ({
      id: e.id,
      status: e.status,
      event_type: e.event_type,
      created_at: e.created_at,
      payload: e.payload_json,
    }))

  const apiStatus = toApiStatus(job.status, {
    matchedProviders: job.matched_providers_count,
    hasOpenOffers: hasOpen,
  })

  return {
    job_id: job.id,
    status: apiStatus,
    category: job.category_slug,
    title: job.title,
    description: job.description,
    priority: job.priority ?? 'medium',
    location: {
      building_name: job.building_name,
      address: job.address,
      city: job.city,
      lat: job.lat,
      lng: job.lng,
    },
    contact: {
      reporter_phone: job.reporter_phone,
      manager_phone: job.manager_phone,
      notes: job.manager_notes,
    },
    source: job.source,
    external_ref: job.external_ref,
    assignment_mode: job.assignment_mode,
    matched_providers: job.matched_providers_count,
    callback_url: job.callback_url,
    assigned_provider_id: job.professional_id,
    offers: offerViews,
    events,
    created_at: job.created_at,
    updated_at: job.updated_at,
  }
}

function pushEvent(jobId: string, status: string, payload: Record<string, unknown> = {}) {
  store().events.push({
    id: randomUUID(),
    job_id: jobId,
    status,
    event_type: 'status_changed',
    payload_json: payload,
    created_at: new Date().toISOString(),
  })
}

export function memoryCreateJob(input: CreateJobInput): JobView {
  const slug = normalizeCategoryKey(input.category)
  if (!slug) throw new Error(`Unknown category: ${input.category}`)

  if (input.external_ref?.ticket_id) {
    for (const j of store().jobs.values()) {
      if (
        j.external_ref?.system === input.external_ref.system &&
        j.external_ref?.ticket_id === input.external_ref.ticket_id
      ) {
        return toView(j)
      }
    }
  }

  const matched = matchProviders(slug, input.location.city, 5)
  const now = new Date().toISOString()
  const status = matched.length === 0 ? 'no_providers' : 'pending'
  const job: MemJob = {
    id: randomUUID(),
    category_slug: slug,
    title: input.title,
    description: input.description,
    priority: input.priority ?? 'medium',
    status,
    building_name: input.location.building_name ?? null,
    address: input.location.address ?? null,
    city: input.location.city,
    lat: input.location.lat ?? null,
    lng: input.location.lng ?? null,
    reporter_phone: input.contact?.reporter_phone ?? null,
    manager_phone: input.contact?.manager_phone ?? null,
    manager_notes: input.contact?.notes ?? null,
    source: input.source ?? 'bamakor',
    external_ref: input.external_ref ?? null,
    assignment_mode: input.assignment_mode ?? 'broadcast_first_accept',
    callback_url: input.callback_url ?? null,
    media_urls: input.media_urls ?? [],
    matched_providers_count: matched.length,
    professional_id: null,
    created_at: now,
    updated_at: now,
  }
  store().jobs.set(job.id, job)

  for (let i = 0; i < matched.length; i++) {
    store().offers.push({
      id: randomUUID(),
      job_id: job.id,
      provider_id: matched[i].id,
      status: 'invited',
      offered_at: now,
      responded_at: null,
    })
  }

  const apiStatus = toApiStatus(status, {
    matchedProviders: matched.length,
    hasOpenOffers: matched.length > 0,
  })
  pushEvent(job.id, apiStatus, { matched_providers: matched.length })

  return toView(job)
}

export function memoryGetJob(jobId: string): JobView | null {
  const job = store().jobs.get(jobId)
  return job ? toView(job) : null
}

export function memoryAcceptOffer(jobId: string, providerId: string): JobView | null {
  const job = store().jobs.get(jobId)
  if (!job) return null
  if (job.professional_id) throw new Error('Already assigned')
  if (job.status !== 'pending') throw new Error('Job not open for accept')

  const offer = store().offers.find(
    (o) => o.job_id === jobId && o.provider_id === providerId && o.status === 'invited',
  )
  if (!offer) throw new Error('No invite for provider')

  const now = new Date().toISOString()
  offer.status = 'accepted'
  offer.responded_at = now
  for (const o of store().offers) {
    if (o.job_id === jobId && o.id !== offer.id && o.status === 'invited') {
      o.status = 'expired'
      o.responded_at = now
    }
  }
  job.professional_id = providerId
  job.status = 'accepted'
  job.updated_at = now
  pushEvent(jobId, 'accepted', { provider_id: providerId })
  return toView(job)
}

export function memoryUpdateStatus(
  jobId: string,
  apiStatus: JobApiStatus,
): JobView | null {
  const job = store().jobs.get(jobId)
  if (!job) return null
  const map: Record<string, string> = {
    accepted: 'accepted',
    en_route: 'on_the_way',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
    expired: 'expired',
  }
  const next = map[apiStatus]
  if (!next) throw new Error(`Unsupported status: ${apiStatus}`)
  job.status = next
  job.updated_at = new Date().toISOString()
  pushEvent(jobId, apiStatus, {})
  return toView(job)
}

export function memoryListProviders() {
  return store().providers.map((p) => ({ ...p }))
}
