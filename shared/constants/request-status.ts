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

/** High-contrast badges — bg + text + ring */
export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending:
    'bg-amber-100 text-amber-950 ring-2 ring-amber-400 font-bold',
  accepted:
    'bg-sky-100 text-sky-950 ring-2 ring-sky-400 font-bold',
  on_the_way:
    'bg-indigo-100 text-indigo-950 ring-2 ring-indigo-400 font-bold',
  in_progress:
    'bg-violet-100 text-violet-950 ring-2 ring-violet-400 font-bold',
  completed:
    'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 font-bold',
  cancelled:
    'bg-red-100 text-red-950 ring-2 ring-red-400 font-bold',
}

/** Colored start border for list cards */
export const REQUEST_STATUS_ACCENT: Record<RequestStatus, string> = {
  pending: 'border-s-4 border-s-amber-500',
  accepted: 'border-s-4 border-s-sky-500',
  on_the_way: 'border-s-4 border-s-indigo-500',
  in_progress: 'border-s-4 border-s-violet-500',
  completed: 'border-s-4 border-s-emerald-500',
  cancelled: 'border-s-4 border-s-red-500',
}

export const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  'accepted',
  'on_the_way',
  'in_progress',
]
