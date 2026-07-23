/** Bamakor / partner-facing job statuses (API contract) */
export const JOB_API_STATUSES = [
  'draft',
  'open',
  'offered',
  'accepted',
  'en_route',
  'in_progress',
  'completed',
  'cancelled',
  'expired',
  'no_providers',
  'rejected_by_all',
] as const

export type JobApiStatus = (typeof JOB_API_STATUSES)[number]

/** Internal Fixly `requests.status` values used for Bamakor jobs */
export const FIXLY_JOB_STATUSES = [
  'pending',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'cancelled',
  'no_providers',
  'rejected_by_all',
  'expired',
] as const

export type FixlyJobStatus = (typeof FIXLY_JOB_STATUSES)[number]

export type AssignmentMode = 'broadcast_first_accept' | 'manual_select'

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ExternalRef = {
  system: string
  ticket_id: string
  ticket_number?: number | null
  client_id?: string | null
  client_name?: string | null
}

export type JobLocation = {
  building_name?: string | null
  address?: string | null
  city: string
  lat?: number | null
  lng?: number | null
}

export type JobContact = {
  reporter_phone?: string | null
  manager_phone?: string | null
  notes?: string | null
}

export type CreateJobInput = {
  source?: 'bamakor' | 'api' | 'fixly'
  external_ref?: ExternalRef | null
  category: string
  title: string
  description: string
  priority?: JobPriority
  location: JobLocation
  contact?: JobContact | null
  media_urls?: string[]
  assignment_mode?: AssignmentMode
  callback_url?: string | null
}

export type JobOfferView = {
  offer_id: string
  provider_id: string
  provider_name: string
  status: string
  offered_at: string
  responded_at?: string | null
}

export type JobView = {
  job_id: string
  status: JobApiStatus
  category: string | null
  title: string
  description: string | null
  priority: JobPriority
  location: JobLocation
  contact: JobContact
  source: string
  external_ref: ExternalRef | null
  assignment_mode: AssignmentMode
  matched_providers: number
  callback_url: string | null
  assigned_provider_id: string | null
  offers: JobOfferView[]
  events: Array<{
    id: string
    status: string
    event_type: string
    created_at: string
    payload: Record<string, unknown>
  }>
  created_at: string
  updated_at: string
}

export type WebhookProvider = {
  id: string
  /** Contract field (brief) */
  name: string
  phone?: string | null
  category?: string | null
  /** @deprecated alias of name — kept for early consumers */
  display_name?: string
}

export type WebhookPayload = {
  event: 'job.status_changed'
  job_id: string
  status: JobApiStatus
  previous_status?: JobApiStatus | null
  external_ref: ExternalRef | null
  provider?: WebhookProvider | null
  occurred_at: string
  payload?: Record<string, unknown>
}
