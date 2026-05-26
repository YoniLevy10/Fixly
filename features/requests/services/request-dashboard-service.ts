import type { MarketplaceRequest } from '@/types/marketplace-request'

export function buildRequestDashboard(
  requests: MarketplaceRequest[]
) {
  return {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    onTheWay: requests.filter((r) => r.status === 'on_the_way').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    cancelled: requests.filter((r) => r.status === 'cancelled').length,
  }
}
