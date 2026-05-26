import { mockRequestRepository } from '@/mock/mock-request-repository'
import type { MarketplaceRequest } from '@/types/marketplace-request'

export async function createRequest(request: MarketplaceRequest) {
  await mockRequestRepository.create(request)
}
