'use client'

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useAuth } from '@/lib/auth/auth-provider'
import type { DemoTourStepId } from '@/lib/demo/investor-tour'
import { DemoTourContext } from '@/components/demo/demo-tour-context'

/**
 * Layout-level tour controller — survives route changes.
 * Critical: /demo must NOT own the AbortController, or navigating to
 * /tracking aborts the walkthrough mid-flight.
 *
 * Lifecycle: start → steps → done → hard exit (clear session, home, idle UI).
 * Stop / abort uses the same hard exit so the pro dashboard never stays stuck.
 *
 * investor-tour is dynamically imported so the home critical path does not
 * pay for the full mock walkthrough graph.
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

  const exitTourUi = useCallback(async () => {
    const { finishInvestorDemoTour } = await import('@/lib/demo/investor-tour')
    finishInvestorDemoTour({
      switchRole: (role) => switchRef.current(role),
      navigate: (path) => routerRef.current.push(path),
    })
    runningRef.current = false
    setTourRunning(false)
    setTourStep(null)
  }, [])

  const stopTour = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    void exitTourUi()
  }, [exitTourUi])

  const startTour = useCallback(async () => {
    if (!isDemoDataMode()) return
    // Do not restart mid-flight — restarting aborted the previous walkthrough
    // right after /demo navigated to /tracking (looked like "stuck on pending").
    if (runningRef.current) return

    const { runInvestorDemoTour } = await import('@/lib/demo/investor-tour')

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
      // Successful finish already called finishInvestorDemoTour inside the runner
      if (abortRef.current === ac) abortRef.current = null
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // stopTour already ran exitTourUi
        return
      }
      console.error('[demo-tour]', err)
      setTourError(err instanceof Error ? err.message : 'הסיור נכשל — נסו שוב')
      await exitTourUi()
    } finally {
      if (abortRef.current === ac) abortRef.current = null
      runningRef.current = false
      setTourRunning(false)
    }
  }, [exitTourUi])

  const value = useMemo(
    () => ({ tourRunning, tourStep, tourError, startTour, stopTour }),
    [tourRunning, tourStep, tourError, startTour, stopTour]
  )

  return (
    <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>
  )
}

export {
  DemoTourIdleProvider,
  useDemoTour,
} from '@/components/demo/demo-tour-context'
