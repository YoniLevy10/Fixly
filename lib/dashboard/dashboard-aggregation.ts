import type { MarketplaceRequest } from '@/types/marketplace-request'

export function aggregateDashboard(requests: MarketplaceRequest[]) {
  return {
    total: requests.length,
    completed: requests.filter((r) => r.status === 'completed').length,
    pending: requests.filter((r) => r.status === 'pending').length,
  }
}
