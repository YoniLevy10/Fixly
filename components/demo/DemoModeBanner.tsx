'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useLocale } from '@/lib/i18n/locale-provider'
import { useAuth } from '@/lib/auth/auth-provider'
import { routes } from '@/lib/routes'
import { DEMO_TOUR_STEPS } from '@/lib/demo/investor-tour'
import { useDemoTour } from '@/components/demo/DemoTourProvider'

/**
 * Minimal investor-demo chrome.
 * Keep idle controls light; while the tour runs show only the active step + stop.
 */
export default function DemoModeBanner() {
  const { t } = useLocale()
  const { user, switchDemoRole } = useAuth()
  const router = useRouter()
  const { tourRunning, tourStep, tourError, startTour, stopTour } = useDemoTour()

  useEffect(() => {
    if (tourRunning || tourError || !tourStep) return
    const tmr = window.setTimeout(() => {
      /* step owned by provider — leave visible briefly after success */
    }, 2500)
    return () => window.clearTimeout(tmr)
  }, [tourRunning, tourError, tourStep])

  if (!isDemoDataMode()) return null

  const isPro = user.role === 'professional'
  const stepMeta = tourStep
    ? DEMO_TOUR_STEPS.find((s) => s.id === tourStep)
    : null

  // During the walkthrough: one calm status line — no role toggle clutter
  if (tourRunning) {
    return (
      <div className="bg-secondary text-secondary-foreground text-xs font-bold py-1.5 px-3 z-[60] relative">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>
            {stepMeta ? t(stepMeta.labelKey) : t('demo.tourRunning')}
          </span>
          <button
            type="button"
            onClick={stopTour}
            className="underline underline-offset-2 hover:opacity-90"
          >
            {t('demo.tourStop')}
          </button>
        </div>
        {tourError ? (
          <div className="mt-1 text-center font-medium text-red-900">{tourError}</div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="bg-secondary text-secondary-foreground text-xs font-bold py-1.5 px-3 z-[60] relative">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>{t('demo.banner')}</span>

        <div className="inline-flex rounded-full border border-secondary-foreground/30 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              switchDemoRole('customer')
              router.push(routes.home)
            }}
            className={`px-2.5 py-0.5 ${!isPro ? 'bg-secondary-foreground text-secondary' : 'opacity-80'}`}
          >
            {t('demo.roleCustomer')}
          </button>
          <button
            type="button"
            onClick={() => {
              switchDemoRole('professional')
              router.push(routes.proDashboard)
            }}
            className={`px-2.5 py-0.5 ${isPro ? 'bg-secondary-foreground text-secondary' : 'opacity-80'}`}
          >
            {t('demo.rolePro')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => void startTour()}
          className="underline underline-offset-2 hover:opacity-90"
        >
          {t('demo.tourStart')}
        </button>
      </div>

      {tourError ? (
        <div className="mt-1 text-center font-medium text-red-900">{tourError}</div>
      ) : null}
    </div>
  )
}
