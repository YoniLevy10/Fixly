'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useDemoTour } from '@/components/demo/DemoTourProvider'
import { useLocale } from '@/lib/i18n/locale-provider'
import { DEMO_TOUR_STEPS } from '@/lib/demo/investor-tour'
import { routes } from '@/lib/routes'
import Link from 'next/link'

/**
 * Investor deep-link: https://fixly.tech/demo
 * Starts the layout-level tour (survives navigation to tracking / pro).
 * When the tour ends, leave this spinner page for the pro dashboard.
 */
export default function InvestorDemoPage() {
  const { t } = useLocale()
  const router = useRouter()
  const { startTour, tourRunning, tourError, tourStep } = useDemoTour()
  const started = useRef(false)
  const sawRunning = useRef(false)

  useEffect(() => {
    if (started.current || !isDemoDataMode()) return
    started.current = true
    void startTour()
  }, [startTour])

  useEffect(() => {
    if (tourRunning) sawRunning.current = true
  }, [tourRunning])

  useEffect(() => {
    if (!isDemoDataMode()) return
    if (!sawRunning.current || tourRunning) return
    // Tour finished (or aborted) — don't leave investors on an orphan spinner
    router.replace(routes.proDashboard)
  }, [tourRunning, router])

  const stepLabel = tourStep
    ? DEMO_TOUR_STEPS.find((s) => s.id === tourStep)?.labelKey
    : null

  if (!isDemoDataMode()) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-black">{t('demo.tourStart')}</h1>
        <p className="text-sm text-foreground/70">{t('demo.tourError')}</p>
        <Link href={routes.home} className="text-primary font-bold underline">
          {t('demo.backHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-10 h-10 border-4 border-muted border-t-secondary rounded-full animate-spin" />
      <h1 className="text-xl font-black">{t('demo.tourStart')}</h1>
      <p className="text-sm text-foreground/70 max-w-sm">
        {tourError
          ? tourError
          : tourRunning && stepLabel
            ? t(stepLabel)
            : t('demo.tourRunning')}
      </p>
      {tourError ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void startTour()}
            className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            {t('demo.tourStart')}
          </button>
          <Link href={routes.proDashboard} className="text-primary font-bold text-sm underline">
            {t('demo.viewYossiDashboard')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
