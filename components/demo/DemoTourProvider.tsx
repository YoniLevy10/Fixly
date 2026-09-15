'use client'

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useAuth } from '@/lib/auth/auth-provider'
import type { DemoTourStepId } from '@/lib/demo/investor-tour'
import { DEMO_TOUR_STEPS } from '@/lib/demo/investor-tour'
import { narrativeFor } from '@/lib/demo/tour-narrative'
import { DemoTourContext } from '@/components/demo/demo-tour-context'
import { translate } from '@/lib/i18n/translate'
import { useLocale } from '@/lib/i18n/locale-provider'

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
  const { locale } = useLocale()
  const [tourRunning, setTourRunning] = useState(false)
  const [tourStep, setTourStep] = useState<DemoTourStepId | null>(null)
  const [tourError, setTourError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const runningRef = useRef(false)
  const routerRef = useRef(router)
  const switchRef = useRef(switchDemoRole)
  const spotlightRef = useRef<{ destroy: () => void } | null>(null)
  const localeRef = useRef(locale)
  routerRef.current = router
  switchRef.current = switchDemoRole
  localeRef.current = locale

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

    const titleKey =
      DEMO_TOUR_STEPS.find((s) => s.id === step)?.labelKey ?? 'demo.tourRunning'
    const storyMap: Record<DemoTourStepId, string> = {
      create: 'demo.tourStoryCreate',
      pending: 'demo.tourStoryPending',
      accepted: 'demo.tourStoryAccepted',
      on_the_way: 'demo.tourStoryOnTheWay',
      customer_map: 'demo.tourStoryMap',
      in_progress: 'demo.tourStoryInProgress',
      completed: 'demo.tourStoryCompleted',
      done: 'demo.tourStoryDone',
    }
    const handle = await showTourSpotlight(
      beat.spotlight,
      translate(localeRef.current, titleKey),
      translate(localeRef.current, storyMap[step])
    )
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

    try {
      await runInvestorDemoTour({
        switchRole: (role) => switchRef.current(role),
        navigate: (path) => routerRef.current.push(path),
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
