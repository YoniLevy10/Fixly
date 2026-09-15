'use client'

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useAuth } from '@/lib/auth/auth-provider'
import type { DemoTourStepId } from '@/lib/demo/investor-tour'
import { narrativeFor } from '@/lib/demo/tour-narrative'
import { DemoTourContext } from '@/components/demo/demo-tour-context'

/**
 * Layout-level tour controller — survives route changes.
 * Critical: /demo must NOT own the AbortController, or navigating to
 * /tracking aborts the walkthrough mid-flight.
 *
 * Lifecycle: start → narrative beats + spotlights → hard exit to pro dashboard.
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
  const spotlightRef = useRef<{ destroy: () => void } | null>(null)
  routerRef.current = router
  switchRef.current = switchDemoRole

  const clearSpotlight = useCallback(() => {
    spotlightRef.current?.destroy()
    spotlightRef.current = null
  }, [])

  const exitTourUi = useCallback(async () => {
    clearSpotlight()
    const { finishInvestorDemoTour } = await import('@/lib/demo/investor-tour')
    finishInvestorDemoTour({
      switchRole: (role) => switchRef.current(role),
      navigate: (path) => routerRef.current.push(path),
    })
    runningRef.current = false
    setTourRunning(false)
    setTourStep(null)
  }, [clearSpotlight])

  const stopTour = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    void exitTourUi()
  }, [exitTourUi])

  const runSpotlight = useCallback(async (step: DemoTourStepId) => {
    clearSpotlight()
    const beat = narrativeFor(step)
    if (!beat?.spotlight) return

    const { showTourSpotlight, waitForSelector } = await import(
      '@/components/demo/tour-spotlight'
    )
    await waitForSelector(beat.spotlight, 4500)

    // Softer overlay on pro sheet — it already has its own backdrop
    const soft = beat.spotlight.includes('pro-job-sheet')
    const handle = await showTourSpotlight(beat.spotlight, {
      overlayOpacity: soft ? 0.12 : 0.28,
    })
    spotlightRef.current = handle
  }, [clearSpotlight])

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

    const navigateClean = (path: string) => {
      // Tear down spotlight before route change so overlays don't stack
      clearSpotlight()
      routerRef.current.push(path)
    }

    try {
      await runInvestorDemoTour({
        switchRole: (role) => switchRef.current(role),
        navigate: navigateClean,
        onStep: setTourStep,
        onSpotlight: runSpotlight,
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
      clearSpotlight()
      if (abortRef.current === ac) abortRef.current = null
      runningRef.current = false
      setTourRunning(false)
      setTourStep(null)
    }
  }, [clearSpotlight, exitTourUi, runSpotlight])

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
