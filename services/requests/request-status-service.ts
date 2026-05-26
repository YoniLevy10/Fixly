import type { RequestStatus } from '@/types/request'
import { canTransition } from '@/lib/guards/request-transition'

export function updateRequestStatus(
  current: RequestStatus,
  next: RequestStatus
) {
  if (!canTransition(current, next)) {
    throw new Error('Invalid request status transition')
  }

  return next
}
