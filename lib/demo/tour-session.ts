import type { MockRequest } from '@/mock/requests'

export const DEMO_TOUR_REQUEST_KEY = 'fixly-demo-tour-request'
export const DEMO_TOUR_EVENT = 'fixly-demo-request'

export function readTourRequest(id?: string): MockRequest | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DEMO_TOUR_REQUEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MockRequest
    if (id && parsed.id !== id) return null
    return parsed
  } catch {
    return null
  }
}

export function writeTourRequest(request: MockRequest): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(DEMO_TOUR_REQUEST_KEY, JSON.stringify(request))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DEMO_TOUR_EVENT, { detail: request })
    )
  }
}

export function clearTourRequest(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(DEMO_TOUR_REQUEST_KEY)
}
