import type { MarketplaceRequest } from '@/types/marketplace-request'

export function assignProfessionalToRequest(
  request: MarketplaceRequest,
  professionalId: string
): MarketplaceRequest {
  return {
    ...request,
    professionalId,
    status: 'accepted',
  }
}
