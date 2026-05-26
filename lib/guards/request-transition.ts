import type { RequestStatus } from '@/types/request'

const transitions: Record<RequestStatus, RequestStatus[]> = {
  pending: ['accepted'],
  accepted: ['on_the_way'],
  on_the_way: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
}

export function canTransition(
  current: RequestStatus,
  next: RequestStatus
) {
  return transitions[current].includes(next)
}
