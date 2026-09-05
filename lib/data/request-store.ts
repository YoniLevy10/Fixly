import { getMockRequests, type MockRequest, type CreateRequestInput } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { getApprovedProfessionals } from '@/mock/professionals'
import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'

let store: MockRequest[] = [...getMockRequests()]

/** Reload full demo seed when flag is on but store was initialized before it. */
function ensureDemoStore() {
  if (!isDemoDataMode()) return
  if (store.length < 50) {
    store = [...getMockRequests()]
  }
}

export function listRequests(): MockRequest[] {
  ensureDemoStore()
  return [...store].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getRequestById(id: string): MockRequest | undefined {
  ensureDemoStore()
  return store.find((r) => r.id === id)
}

export function listRequestsByCustomer(customerId: string): MockRequest[] {
  return listRequests().filter((r) => r.customerId === customerId)
}

export function listRequestsByProfessional(professionalId: string): MockRequest[] {
  return listRequests().filter(
    (r) =>
      r.professionalId === professionalId ||
      r.candidates?.some(
        (c) => c.professionalId === professionalId && (c.status ?? 'invited') === 'invited'
      )
  )
}

export function createRequest(input: CreateRequestInput): MockRequest {
  const { matchMode: useMulti, ...rest } = input
  const request: MockRequest = {
    id: `req-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    liveTrackingActive: false,
    ...rest,
    professionalId: input.professionalId ?? '',
    matchMode: useMulti ? 'multi' : 'single',
  }

  // Multi-match demo: seed invited candidates so pro dashboard + accept-invite work
  if (useMulti && !request.professionalId) {
    const available = getApprovedProfessionals().filter((p) => p.isAvailable)
    const demoPro = available.find((p) => p.id === DEMO_PROFESSIONAL_ID)
    const others = available.filter((p) => p.id !== DEMO_PROFESSIONAL_ID).slice(0, 4)
    const picked = demoPro ? [demoPro, ...others] : available.slice(0, 5)
    request.candidates = picked.map((p, rank) => ({
      professionalId: p.id,
      rank: rank + 1,
      name: p.name,
      rating: p.rating,
      status: 'invited',
    }))
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

/**
 * Insert-or-replace a full request row.
 * Used by the investor demo tour so any serverless isolate can accept
 * the client-owned snapshot (in-memory stores are not shared on Vercel).
 */
export function upsertRequest(request: MockRequest): MockRequest {
  ensureDemoStore()
  const index = store.findIndex((r) => r.id === request.id)
  if (index === -1) {
    store = [request, ...store]
  } else {
    store = [...store.slice(0, index), request, ...store.slice(index + 1)]
  }
  return request
}

/** Reset store (tests) */
export function resetRequestStore(): void {
  store = [...getMockRequests()]
}
