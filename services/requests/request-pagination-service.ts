import type { MarketplaceRequest } from '@/types/marketplace-request'

export function paginateRequests(
  requests: MarketplaceRequest[],
  page: number,
  limit: number
) {
  const start = (page - 1) * limit
  const end = start + limit

  return requests.slice(start, end)
}
