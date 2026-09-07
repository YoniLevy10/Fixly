'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useAuth } from '@/lib/auth/auth-provider'
import {
  runInvestorDemoTour,
  type DemoTourStepId,
} from '@/lib/demo/investor-tour'

type DemoTourContextValue = {
  tourRunning: boolean
  tourStep: DemoTourStepId | null
  tourError: string | null
  startTour: () => Promise<void>
  stopTour: () => void
}

const DemoTourContext = createContext<DemoTourContextValue | null>(null)

/**
 * Layout-level tour controller — survives route changes.
 * Critical: /demo must NOT own the AbortController, or navigating to
 * /tracking aborts the walkthrough mid-flight.
 */
export function DemoTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { switchDemoRole } = useAuth()
  const [tourRunning, setTourRunning] = useState(false)
  const [tourStep, setTourStep] = useState<DemoTourStepId | null>(null)
  const [tourError, setTourError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const runningRef = useRef(false)
  const routerRef = useRef(router)
  const switchRef = useRef(switchDemoRole)
  routerRef.current = router
  switchRef.current = switchDemoRole

  const stopTour = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    runningRef.current = false
    setTourRunning(false)
    setTourStep(null)
  }, [])

  const startTour = useCallback(async () => {
    if (!isDemoDataMode()) return
    // Do not restart mid-flight — restarting aborted the previous walkthrough
    // right after /demo navigated to /tracking (looked like "stuck on pending").
    if (runningRef.current) return

    setTourError(null)
    setTourRunning(true)
    runningRef.current = true
    setTourStep('create')
    const ac = new AbortController()
    abortRef.current = ac

    try {
      await runInvestorDemoTour({
        switchRole: (role) => switchRef.current(role),
        navigate: (path) => routerRef.current.push(path),
        onStep: setTourStep,
        signal: ac.signal,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('[demo-tour]', err)
      setTourError(err instanceof Error ? err.message : 'הסיור נכשל — נסו שוב')
    } finally {
      if (abortRef.current === ac) abortRef.current = null
      runningRef.current = false
      setTourRunning(false)
    }
  }, [])

  const value = useMemo(
    () => ({ tourRunning, tourStep, tourError, startTour, stopTour }),
    [tourRunning, tourStep, tourError, startTour, stopTour]
  )

  return (
    <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>
  )
}

export function useDemoTour(): DemoTourContextValue {
  const ctx = useContext(DemoTourContext)
  if (!ctx) {
    throw new Error('useDemoTour must be used within DemoTourProvider')
  }
  return ctx
}
