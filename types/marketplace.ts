import type { RequestStatus } from '@/shared/constants/request-status'

export interface Category {
  id: string
  name: string
  icon?: string
}

export interface Professional {
  id: string
  name: string
  category: string
  rating: number
  jobsCompleted: number
  available: boolean
  city?: string
}

export interface MarketplaceRequest {
  id: string
  title: string
  description?: string
  address?: string
  status: RequestStatus
  customerId: string
  professionalId?: string
  createdAt: string
}
