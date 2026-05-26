import type { MarketplaceRequest } from '@/types/marketplace-request'

export function validateMarketplaceRequest(
  request: MarketplaceRequest
) {
  const errors: string[] = []

  if (!request.title) {
    errors.push('Title is required')
  }

  if (!request.customerId) {
    errors.push('Customer is required')
  }

  if (!request.categoryId) {
    errors.push('Category is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
