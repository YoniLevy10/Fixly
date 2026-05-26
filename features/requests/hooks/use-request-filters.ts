import { useMemo } from 'react'

import type { MarketplaceRequest } from '@/types/marketplace-request'
import type { RequestStatus } from '@/types/request'
import { getRequestsByStatus } from '@/services/requests/request-query-service'

export function useRequestFilters(
  requests: MarketplaceRequest[],
  status: RequestStatus
) {
  const filteredRequests = useMemo(() => {
    return getRequestsByStatus(requests, status)
  }, [requests, status])

  return {
    filteredRequests,
  }
}
