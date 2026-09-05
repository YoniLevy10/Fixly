'use client'

import { useEffect, useRef } from 'react'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useDemoTour } from '@/components/demo/DemoTourProvider'
import { useLocale } from '@/lib/i18n/locale-provider'

/**
 * Investor deep-link: https://fixly.tech/demo
 * Kicks off the layout-level tour (survives navigation to tracking / pro).
 */
export default function InvestorDemoPage() {
  const { t } = useLocale()
  const { startTour, tourRunning, tourError, tourStep } = useDemoTour()
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !isDemoDataMode()) return
    started.current = true
    void startTour()
  }, [startTour])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-10 h-10 border-4 border-muted border-t-secondary rounded-full animate-spin" />
      <h1 className="text-xl font-black">{t('demo.tourStart')}</h1>
      <p className="text-sm text-foreground/70 max-w-sm">
        {tourRunning
          ? `${t('demo.tourRunning')}${tourStep ? ` — ${tourStep}` : ''}`
          : tourError
            ? tourError
            : t('demo.banner')}
      </p>
    </div>
  )
}
