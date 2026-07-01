import type { RequestStatus } from '@/shared/constants/request-status'

export type RequestCandidate = {
  professionalId: string
  rank: number
  name: string
  rating: number
  status?: string
}

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
  matchMode?: 'single' | 'multi'
  candidates?: RequestCandidate[]
  quotedAmount?: number
  paymentStatus?: string
  needsReview?: boolean
  referralCode?: string
}

export type CreateRequestInput = Omit<
  MockRequest,
  | 'id'
  | 'createdAt'
  | 'status'
  | 'needsReview'
  | 'candidates'
  | 'matchMode'
  | 'paymentStatus'
  | 'professionalId'
> & {
  professionalId?: string
  matchMode?: boolean
  categoryId?: string
  categorySlug?: string
  city?: string
}

import { getDemoRequests } from '@/mock/demo-requests'

export function getMockRequests(): MockRequest[] {
  return getDemoRequests()
}

/** @deprecated Prefer getMockRequests() */
export const MOCK_REQUESTS: MockRequest[] = getDemoRequests()
