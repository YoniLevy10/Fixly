import type { FixlyJobStatus, JobApiStatus } from './types'

/** Map Fixly DB status (+ offer context) → Bamakor API status */
export function toApiStatus(
  fixlyStatus: string,
  opts?: { matchedProviders?: number; hasOpenOffers?: boolean },
): JobApiStatus {
  switch (fixlyStatus) {
    case 'no_providers':
      return 'no_providers'
    case 'rejected_by_all':
      return 'rejected_by_all'
    case 'expired':
      return 'expired'
    case 'accepted':
      return 'accepted'
    case 'on_the_way':
      return 'en_route'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'pending':
    default: {
      const matched = opts?.matchedProviders ?? 0
      if (matched <= 0) return 'open'
      if (opts?.hasOpenOffers === false && matched > 0) return 'rejected_by_all'
      return 'offered'
    }
  }
}

/** Map Bamakor API status → Fixly DB status */
export function toFixlyStatus(apiStatus: JobApiStatus): FixlyJobStatus {
  switch (apiStatus) {
    case 'draft':
    case 'open':
    case 'offered':
      return 'pending'
    case 'en_route':
      return 'on_the_way'
    case 'accepted':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
    case 'expired':
    case 'no_providers':
    case 'rejected_by_all':
      return apiStatus
    default:
      return 'pending'
  }
}

/** Hebrew UX copy for status lifecycle (product brief) */
export const STATUS_COPY_HE: Record<JobApiStatus, string> = {
  draft: 'טיוטה',
  open: 'נשלח',
  offered: 'נשלח',
  accepted: 'התקבל',
  en_route: 'בדרך',
  in_progress: 'בטיפול',
  completed: 'הושלם',
  cancelled: 'בוטל',
  expired: 'פג תוקף',
  no_providers: 'אין ספקים בקטגוריה הזו באזור',
  rejected_by_all: 'לא התקבל',
}

const API_TRANSITIONS: Record<JobApiStatus, JobApiStatus[]> = {
  draft: ['open', 'cancelled'],
  open: ['offered', 'no_providers', 'cancelled', 'expired'],
  offered: ['accepted', 'rejected_by_all', 'cancelled', 'expired'],
  accepted: ['en_route', 'cancelled'],
  en_route: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  expired: [],
  no_providers: ['open', 'cancelled'],
  rejected_by_all: ['open', 'cancelled'],
}

export function canTransitionApi(from: JobApiStatus, to: JobApiStatus): boolean {
  return API_TRANSITIONS[from]?.includes(to) ?? false
}
