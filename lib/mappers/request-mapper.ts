import type { MarketplaceRequest } from '@/types/marketplace-request'

export function mapRequestStatus(request: MarketplaceRequest) {
  return {
    ...request,
    isCompleted: request.status === 'completed',
    isPending: request.status === 'pending',
  }
}
