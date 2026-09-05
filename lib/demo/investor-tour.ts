import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { getProfessionalById } from '@/mock/professionals'
import { createRequestApi } from '@/shared/hooks/use-requests-api'
import type { MockRequest } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'
import {
  writeTourRequest,
  clearTourRequest,
} from '@/lib/demo/tour-session'

export const DEMO_TOUR_STORAGE_KEY = 'fixly-demo-tour-request-id'

export type DemoTourStepId =
  | 'create'
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'customer_map'
  | 'in_progress'
  | 'completed'
  | 'done'

export type DemoTourStep = {
  id: DemoTourStepId
  labelKey: string
}

/** Ordered investor walkthrough (~90s with default delays) */
export const DEMO_TOUR_STEPS: DemoTourStep[] = [
  { id: 'create', labelKey: 'demo.tourStepCreate' },
  { id: 'pending', labelKey: 'demo.tourStepPending' },
  { id: 'accepted', labelKey: 'demo.tourStepAccepted' },
  { id: 'on_the_way', labelKey: 'demo.tourStepOnTheWay' },
  { id: 'customer_map', labelKey: 'demo.tourStepMap' },
  { id: 'in_progress', labelKey: 'demo.tourStepInProgress' },
  { id: 'completed', labelKey: 'demo.tourStepCompleted' },
  { id: 'done', labelKey: 'demo.tourStepDone' },
]

const STATUS_FLOW: RequestStatus[] = [
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
]

export type RunInvestorTourOptions = {
  switchRole: (role: 'customer' | 'professional') => void
  navigate: (path: string) => void
  onStep?: (step: DemoTourStepId) => void
  /** Multiplier for delays (tests can use 0) */
  delayScale?: number
  signal?: AbortSignal
}

function delay(ms: number, scale: number, signal?: AbortSignal) {
  if (scale <= 0) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const t = setTimeout(resolve, ms * scale)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}

/** Persist snapshot to every Vercel isolate via upsert (in-memory alone is flaky). */
async function persistTourRequest(request: MockRequest): Promise<MockRequest> {
  writeTourRequest(request)
  const res = await fetch('/api/demo/requests', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      typeof err.error === 'string' ? err.error : 'שמירת הדגמה נכשלה'
    )
  }
  return res.json()
}

function withStatus(current: MockRequest, status: RequestStatus): MockRequest {
  const next: MockRequest = {
    ...current,
    status,
    liveTrackingActive: status === 'on_the_way',
  }
  if (status === 'on_the_way') {
    // Seed a nearby pro pin so the live map has something to show
    next.proLat = (current.destinationLat ?? 32.0629) - 0.012
    next.proLng = (current.destinationLng ?? 34.7698) - 0.008
    next.proLocationUpdatedAt = new Date().toISOString()
  }
  if (status === 'completed' || status === 'cancelled') {
    next.liveTrackingActive = false
  }
  return next
}

/**
 * Creates a demo booking and advances it through the full lifecycle,
 * flipping customer ↔ pro so investors see both sides.
 *
 * Status updates go through sessionStorage + PUT /api/demo/requests (upsert)
 * so they survive Vercel's multi-instance memory isolation — the root cause
 * of "עדכון נכשל" on production.
 */
export async function runInvestorDemoTour(
  options: RunInvestorTourOptions
): Promise<string> {
  const { switchRole, navigate, onStep, delayScale = 1, signal } = options
  const wait = (ms: number) => delay(ms, delayScale, signal)

  const pro = getProfessionalById(DEMO_PROFESSIONAL_ID)
  const professionalName = pro?.name ?? 'יוסי כהן'
  const category = pro?.category ?? 'אינסטלציה'

  clearTourRequest()
  switchRole('customer')
  onStep?.('create')

  const created = await createRequestApi({
    customerName: 'משקיע Fixly',
    customerPhone: '050-0000000',
    professionalId: DEMO_PROFESSIONAL_ID,
    professionalName,
    category,
    title: 'הדגמת הזמנה למשקיעים',
    description: 'ברז דולף במטבח — סיור הדגמה אוטומטי למשקיעים',
    location: 'רוטשילד 22, תל אביב',
    destinationLat: 32.0629,
    destinationLng: 34.7698,
  })

  let current = await persistTourRequest(created)

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, current.id)
  }

  onStep?.('pending')
  navigate(`/tracking/${current.id}`)
  await wait(2400)

  // Pro side: show dashboard, then auto-accept
  switchRole('professional')
  navigate('/pro/dashboard')
  await wait(1800)

  for (const status of STATUS_FLOW) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    current = await persistTourRequest(withStatus(current, status))
    onStep?.(status as DemoTourStepId)
    await wait(status === 'on_the_way' ? 1600 : 1500)

    if (status === 'on_the_way') {
      switchRole('customer')
      onStep?.('customer_map')
      navigate(`/tracking/${current.id}`)
      await wait(5000)
      switchRole('professional')
      navigate('/pro/dashboard')
      await wait(1500)
    }

    if (status === 'accepted') {
      // Brief beat on pro dashboard after accept so investors see it land
      await wait(800)
    }
  }

  switchRole('customer')
  onStep?.('completed')
  navigate(`/tracking/${current.id}`)
  await wait(1600)
  onStep?.('done')

  return current.id
}

/** Pure helper for unit tests — status sequence investors see */
export function getInvestorTourStatusSequence(): RequestStatus[] {
  return [...STATUS_FLOW]
}
