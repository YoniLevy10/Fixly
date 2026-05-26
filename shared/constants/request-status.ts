export const REQUEST_STATUSES = [
  'pending',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'cancelled',
] as const

export type RequestStatus =
  (typeof REQUEST_STATUSES)[number]

export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  ON_THE_WAY: 'on_the_way',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_the_way: 'On The Way',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  'accepted',
  'on_the_way',
  'in_progress',
]
