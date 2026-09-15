'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { DemoTourStepId } from '@/lib/demo/investor-tour'

export type DemoTourContextValue = {
  tourRunning: boolean
  tourStep: DemoTourStepId | null
  tourError: string | null
  startTour: () => Promise<void>
  stopTour: () => void
}

export const DemoTourContext = createContext<DemoTourContextValue | null>(null)

export const IDLE_TOUR: DemoTourContextValue = {
  tourRunning: false,
  tourStep: null,
  tourError: null,
  startTour: async () => {},
  stopTour: () => {},
}

/** Lightweight shell used while the real provider chunk loads. */
export function DemoTourIdleProvider({ children }: { children: ReactNode }) {
  return (
    <DemoTourContext.Provider value={IDLE_TOUR}>{children}</DemoTourContext.Provider>
  )
}

export function useDemoTour(): DemoTourContextValue {
  const ctx = useContext(DemoTourContext)
  if (!ctx) {
    throw new Error('useDemoTour must be used within DemoTourProvider')
  }
  return ctx
}
