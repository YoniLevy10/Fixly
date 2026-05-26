import type { MarketplaceRequest } from '@/types/marketplace-request'
import type { RequestRepository } from '@/lib/repositories/request-repository'

const requests: MarketplaceRequest[] = []

export const mockRequestRepository: RequestRepository = {
  async getAll() {
    return requests
  },

  async create(request) {
    requests.push(request)
  },
}
