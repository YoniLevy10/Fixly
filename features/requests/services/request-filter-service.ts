import type { MarketplaceRequest } from '@/types/marketplace-request'
import type { RequestStatus } from '@/types/request'

export function filterRequestsByStatus(
  requests: MarketplaceRequest[],
  status: RequestStatus
) {
  return requests.filter((request) => request.status === status)
}
