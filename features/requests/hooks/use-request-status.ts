import { useState } from 'react'

import type { RequestStatus } from '@/types/request'
import { updateRequestStatus } from '@/services/requests/request-status-service'

export function useRequestStatus(initialStatus: RequestStatus) {
  const [status, setStatus] = useState(initialStatus)

  function transition(next: RequestStatus) {
    const updated = updateRequestStatus(status, next)

    setStatus(updated)
  }

  return {
    status,
    transition,
  }
}
