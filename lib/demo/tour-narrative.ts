import type { DemoTourStepId } from '@/lib/demo/investor-tour'

export type TourRole = 'customer' | 'professional' | 'system'

export type TourNarrativeBeat = {
  id: DemoTourStepId
  /** Who the investor is "looking as" */
  role: TourRole
  /** Optional CSS selector for driver.js highlight */
  spotlight?: string
  /** Dwell after navigation / status update (ms) */
  dwellMs: number
}

/**
 * Storyboard for the investor walkthrough.
 * Keeps the screen calm: one beat → one role → one highlight → enough time to read.
 */
export const TOUR_NARRATIVE: TourNarrativeBeat[] = [
  {
    id: 'create',
    role: 'system',
    dwellMs: 2200,
  },
  {
    id: 'pending',
    role: 'customer',
    spotlight: '[data-tour="status-timeline"]',
    dwellMs: 3800,
  },
  {
    id: 'accepted',
    role: 'professional',
    spotlight: '[data-tour="pro-job-sheet"]',
    dwellMs: 3200,
  },
  {
    id: 'on_the_way',
    role: 'professional',
    spotlight: '[data-tour="pro-job-sheet"]',
    dwellMs: 2800,
  },
  {
    id: 'customer_map',
    role: 'customer',
    spotlight: '[data-tour="live-map"]',
    dwellMs: 6500,
  },
  {
    id: 'in_progress',
    role: 'professional',
    spotlight: '[data-tour="pro-job-sheet"]',
    dwellMs: 3200,
  },
  {
    id: 'completed',
    role: 'customer',
    spotlight: '[data-tour="status-timeline"]',
    dwellMs: 4200,
  },
  {
    id: 'done',
    role: 'system',
    dwellMs: 2200,
  },
]

export function narrativeFor(step: DemoTourStepId): TourNarrativeBeat | undefined {
  return TOUR_NARRATIVE.find((b) => b.id === step)
}

export function stepIndex(step: DemoTourStepId | null): number {
  if (!step) return 0
  const i = TOUR_NARRATIVE.findIndex((b) => b.id === step)
  return i < 0 ? 0 : i
}
