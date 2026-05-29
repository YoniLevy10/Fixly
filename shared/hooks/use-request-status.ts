'use client'

import {
  ACTIVE_REQUEST_STATUSES,
  type RequestStatus,
} from '@/shared/constants/request-status'
import { useLocale } from '@/lib/i18n/locale-provider'

export function useRequestStatus(status: RequestStatus) {
  const { t } = useLocale()

  return {
    label: t(`status.${status}`),
    isActive: ACTIVE_REQUEST_STATUSES.includes(status),
    isCompleted: status === 'completed',
    isCancelled: status === 'cancelled',
    isPending: status === 'pending',
  }
}
