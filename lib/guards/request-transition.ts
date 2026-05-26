import type { RequestStatus } from '@/types/request'

const transitions: Record<RequestStatus, RequestStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function canTransition(
  current: RequestStatus,
  next: RequestStatus
) {
  return transitions[current].includes(next)
}
