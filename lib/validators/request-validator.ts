import type { MarketplaceRequest } from '@/types/marketplace-request'

export function validateRequest(request: MarketplaceRequest) {
  return Boolean(
    request.title &&
      request.customerId &&
      request.categoryId &&
      request.status
  )
}
