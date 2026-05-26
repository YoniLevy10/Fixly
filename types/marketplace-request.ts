import type { RequestStatus } from './request'

export type MarketplaceRequest = {
  id: string
  title: string
  description?: string
  customerId: string
  professionalId?: string
  categoryId: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
}
