import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { getProfessionalById } from '@/mock/professionals'
import { createRequestApi } from '@/shared/hooks/use-requests-api'
import type { MockRequest } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'
import {
  writeTourRequest,
  clearTourRequest,
} from '@/lib/demo/tour-session'
import { narrativeFor } from '@/lib/demo/tour-narrative'
import { routes } from '@/lib/routes'

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

/** Ordered investor walkthrough — narrative beats match lib/demo/tour-narrative.ts */
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
  /** Optional spotlight after a beat lands (driver.js). */
  onSpotlight?: (step: DemoTourStepId) => Promise<void> | void
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
  if (status === 'completed') {
    next.liveTrackingActive = false
    // Ensure JobPaymentButton appears for investors on the tracking screen
    next.quotedAmount = current.quotedAmount ?? 420
    next.paymentStatus = current.paymentStatus ?? 'pending'
  }
  if (status === 'cancelled') {
    next.liveTrackingActive = false
  }
  return next
}

async function beat(
  step: DemoTourStepId,
  options: {
    wait: (ms: number) => Promise<void>
    onStep?: (step: DemoTourStepId) => void
    onSpotlight?: (step: DemoTourStepId) => Promise<void> | void
    /** Extra settle time after navigation before spotlight */
    settleMs?: number
  }
) {
  const { wait, onStep, onSpotlight, settleMs = 450 } = options
  onStep?.(step)
  await wait(settleMs)
  await onSpotlight?.(step)
  const dwell = narrativeFor(step)?.dwellMs ?? 2500
  await wait(dwell)
}

/**
 * Creates a demo booking and advances it through the full lifecycle,
 * flipping customer ↔ pro so investors see both sides — with calm dwells
 * and optional spotlights so jumps feel intentional.
 *
 * Always ends on Yossi's pro dashboard (hard exit, single landing).
 */
export async function runInvestorDemoTour(
  options: RunInvestorTourOptions
): Promise<string> {
  const { switchRole, navigate, onStep, onSpotlight, delayScale = 1, signal } =
    options
  const wait = (ms: number) => delay(ms, delayScale, signal)
  const play = (step: DemoTourStepId, settleMs?: number) =>
    beat(step, { wait, onStep, onSpotlight, settleMs })

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

  // Let create story finish before first navigation
  await wait(narrativeFor('create')?.dwellMs ?? 2200)

  // Customer: pending tracking
  navigate(`/tracking/${current.id}`)
  await play('pending', 700)

  // Pro: dashboard + auto-accept flow
  switchRole('professional')
  navigate('/pro/dashboard')
  await wait(900)

  for (const status of STATUS_FLOW) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    current = await persistTourRequest(withStatus(current, status))

    if (status === 'on_the_way') {
      await play('on_the_way', 500)
      switchRole('customer')
      navigate(`/tracking/${current.id}`)
      await play('customer_map', 900)
      switchRole('professional')
      navigate('/pro/dashboard')
      await wait(800)
      continue
    }

    if (status === 'completed') {
      // Show completion on the customer tracking screen (payment + timeline)
      switchRole('customer')
      navigate(`/tracking/${current.id}`)
      await play('completed', 800)
      continue
    }

    await play(status as DemoTourStepId, 600)
  }

  onStep?.('done')
  await wait(narrativeFor('done')?.dwellMs ?? 2200)

  // Single hard landing — Yossi's inbox (no home→dashboard flicker)
  finishInvestorDemoTour({ switchRole, navigate })

  return current.id
}

/** Shared cleanup for successful completion and manual stop */
export function finishInvestorDemoTour(options: {
  switchRole: (role: 'customer' | 'professional') => void
  navigate: (path: string) => void
}): void {
  clearTourRequest()
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY)
  }
  options.switchRole('professional')
  options.navigate(routes.proDashboard)
}

/** Pure helper for unit tests — status sequence investors see */
export function getInvestorTourStatusSequence(): RequestStatus[] {
  return [...STATUS_FLOW]
}
