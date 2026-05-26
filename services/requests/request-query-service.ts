import type { MarketplaceRequest } from '@/types/marketplace-request'
import type { RequestStatus } from '@/types/request'

export function getRequestsByCustomer(
  requests: MarketplaceRequest[],
  customerId: string
) {
  return requests.filter((request) => request.customerId === customerId)
}

export function getRequestsByProfessional(
  requests: MarketplaceRequest[],
  professionalId: string
) {
  return requests.filter((request) => request.professionalId === professionalId)
}

export function getRequestsByStatus(
  requests: MarketplaceRequest[],
  status: RequestStatus
) {
  return requests.filter((request) => request.status === status)
}
