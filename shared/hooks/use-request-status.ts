'use client'

import {
  ACTIVE_REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
} from '@/shared/constants/request-status'

export function useRequestStatus(status: RequestStatus) {
  return {
    label: REQUEST_STATUS_LABELS[status],
    isActive: ACTIVE_REQUEST_STATUSES.includes(status),
    isCompleted: status === 'completed',
    isCancelled: status === 'cancelled',
    isPending: status === 'pending',
  }
}
