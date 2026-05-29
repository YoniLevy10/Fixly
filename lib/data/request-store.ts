import {
  MOCK_REQUESTS,
  type MockRequest,
  type CreateRequestInput,
} from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'

let store: MockRequest[] = [...MOCK_REQUESTS]

export function listRequests(): MockRequest[] {
  return [...store].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getRequestById(id: string): MockRequest | undefined {
  return store.find((r) => r.id === id)
}

export function listRequestsByCustomer(customerId: string): MockRequest[] {
  return listRequests().filter((r) => r.customerId === customerId)
}

export function listRequestsByProfessional(professionalId: string): MockRequest[] {
  return listRequests().filter((r) => r.professionalId === professionalId)
}

export function createRequest(input: CreateRequestInput): MockRequest {
  const request: MockRequest = {
    id: `req-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    liveTrackingActive: false,
    ...input,
  }
  store = [request, ...store]
  return request
}

export function updateRequestLocation(
  id: string,
  lat: number,
  lng: number
): MockRequest | undefined {
  const index = store.findIndex((r) => r.id === id)
  if (index === -1) return undefined
  const updated = {
    ...store[index],
    proLat: lat,
    proLng: lng,
    proLocationUpdatedAt: new Date().toISOString(),
    liveTrackingActive: true,
  }
  store = [...store.slice(0, index), updated, ...store.slice(index + 1)]
  return updated
}

export function updateRequestStatus(
  id: string,
  status: RequestStatus,
  extra?: Partial<MockRequest>
): MockRequest | undefined {
  const index = store.findIndex((r) => r.id === id)
  if (index === -1) return undefined

  const stopTracking =
    status === 'completed' || status === 'cancelled'
  const updated = {
    ...store[index],
    status,
    ...extra,
    ...(stopTracking ? { liveTrackingActive: false } : {}),
    ...(status === 'on_the_way'
      ? { liveTrackingActive: true }
      : {}),
  }
  store = [...store.slice(0, index), updated, ...store.slice(index + 1)]
  return updated
}

/** Reset store (tests) */
export function resetRequestStore(): void {
  store = [...MOCK_REQUESTS]
}
