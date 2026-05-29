import type { RequestStatus } from '@/shared/constants/request-status'

export type MockRequest = {
  id: string
  customerId: string
  customerName: string
  customerPhone?: string
  professionalId: string
  professionalName: string
  category: string
  title?: string
  description: string
  status: RequestStatus
  createdAt: string
  location?: string
  preferredDate?: string
  preferredTime?: string
  images?: string[]
  cancellationReason?: string
  destinationLat?: number
  destinationLng?: number
  proLat?: number
  proLng?: number
  proLocationUpdatedAt?: string
  liveTrackingActive?: boolean
}

export type CreateRequestInput = Omit<
  MockRequest,
  'id' | 'createdAt' | 'status'
>

import { DEMO_REQUESTS } from '@/mock/demo-requests'

export const MOCK_REQUESTS: MockRequest[] = DEMO_REQUESTS
