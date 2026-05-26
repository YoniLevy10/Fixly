import { useState } from 'react'

import type { MarketplaceRequest } from '@/types/marketplace-request'

export function useLocalRequestState(
  initialRequests: MarketplaceRequest[]
) {
  const [requests, setRequests] = useState(initialRequests)

  function prependRequest(request: MarketplaceRequest) {
    setRequests((current) => [request, ...current])
  }

  return {
    requests,
    prependRequest,
  }
}
