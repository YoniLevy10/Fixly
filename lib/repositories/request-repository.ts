import type { MarketplaceRequest } from '@/types/marketplace-request'

export interface RequestRepository {
  getAll(): Promise<MarketplaceRequest[]>
  create(request: MarketplaceRequest): Promise<void>
}
