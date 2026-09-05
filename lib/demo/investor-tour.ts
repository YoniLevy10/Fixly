import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { getProfessionalById } from '@/mock/professionals'
import {
  createRequestApi,
  updateRequestStatusApi,
} from '@/shared/hooks/use-requests-api'
import type { RequestStatus } from '@/shared/constants/request-status'

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

/**
 * Creates a demo booking and advances it through the full lifecycle,
 * flipping customer ↔ pro so investors see both sides.
 */
export async function runInvestorDemoTour(
  options: RunInvestorTourOptions
): Promise<string> {
  const { switchRole, navigate, onStep, delayScale = 1, signal } = options
  const wait = (ms: number) => delay(ms, delayScale, signal)

  const pro = getProfessionalById(DEMO_PROFESSIONAL_ID)
  const professionalName = pro?.name ?? 'יוסי כהן'
  const category = pro?.category ?? 'אינסטלציה'

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

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, created.id)
  }

  onStep?.('pending')
  navigate(`/tracking/${created.id}`)
  await wait(2200)

  switchRole('professional')
  navigate('/pro/dashboard')
  await wait(1600)

  for (const status of STATUS_FLOW) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    await updateRequestStatusApi(created.id, status)
    onStep?.(status as DemoTourStepId)
    await wait(status === 'on_the_way' ? 1800 : 1400)

    if (status === 'on_the_way') {
      switchRole('customer')
      onStep?.('customer_map')
      navigate(`/tracking/${created.id}`)
      await wait(4500)
      switchRole('professional')
      navigate('/pro/dashboard')
      await wait(1400)
    }
  }

  switchRole('customer')
  onStep?.('completed')
  navigate(`/tracking/${created.id}`)
  await wait(1200)
  onStep?.('done')

  return created.id
}

/** Pure helper for unit tests — status sequence investors see */
export function getInvestorTourStatusSequence(): RequestStatus[] {
  return [...STATUS_FLOW]
}
