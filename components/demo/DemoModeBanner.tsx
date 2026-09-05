'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useLocale } from '@/lib/i18n/locale-provider'
import { useAuth } from '@/lib/auth/auth-provider'
import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { routes } from '@/lib/routes'
import { DEMO_TOUR_STEPS } from '@/lib/demo/investor-tour'
import { useDemoTour } from '@/components/demo/DemoTourProvider'

export default function DemoModeBanner() {
  const { t } = useLocale()
  const { user, switchDemoRole } = useAuth()
  const router = useRouter()
  const { tourRunning, tourStep, tourError, startTour, stopTour } = useDemoTour()

  // Clear step shortly after a successful run (errors keep context)
  useEffect(() => {
    if (tourRunning || tourError || !tourStep) return
    const tmr = window.setTimeout(() => {
      /* step is owned by provider; stopTour clears it — leave visible briefly via CSS only */
    }, 2500)
    return () => window.clearTimeout(tmr)
  }, [tourRunning, tourError, tourStep])

  if (!isDemoDataMode()) return null

  const isPro = user.role === 'professional'
  const stepMeta = tourStep
    ? DEMO_TOUR_STEPS.find((s) => s.id === tourStep)
    : null

  return (
    <div className="bg-secondary text-secondary-foreground text-xs font-bold py-1.5 px-3 z-[60] relative">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>{t('demo.banner')}</span>

        <div className="inline-flex rounded-full border border-secondary-foreground/30 overflow-hidden">
          <button
            type="button"
            disabled={tourRunning}
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
            disabled={tourRunning}
            onClick={() => {
              switchDemoRole('professional')
              router.push(routes.proDashboard)
            }}
            className={`px-2.5 py-0.5 ${isPro ? 'bg-secondary-foreground text-secondary' : 'opacity-80'}`}
          >
            {t('demo.rolePro')}
          </button>
        </div>

        <Link
          href={`${routes.newRequest}?professional=${DEMO_PROFESSIONAL_ID}`}
          className="underline underline-offset-2 hover:opacity-90"
        >
          {t('demo.bannerCta')}
        </Link>

        {!tourRunning ? (
          <button
            type="button"
            onClick={() => void startTour()}
            className="underline underline-offset-2 hover:opacity-90"
          >
            {t('demo.tourStart')}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopTour}
            className="underline underline-offset-2 hover:opacity-90"
          >
            {t('demo.tourStop')}
          </button>
        )}
      </div>

      {(tourRunning || tourError) && (
        <div className="mt-1 text-center font-medium opacity-95">
          {tourRunning && stepMeta ? (
            <span>
              {t('demo.tourRunning')}: {t(stepMeta.labelKey)}
            </span>
          ) : null}
          {tourError ? <span className="text-red-900 ms-2">{tourError}</span> : null}
        </div>
      )}
    </div>
  )
}
