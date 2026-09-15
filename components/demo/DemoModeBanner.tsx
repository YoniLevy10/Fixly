'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useLocale } from '@/lib/i18n/locale-provider'
import { useAuth } from '@/lib/auth/auth-provider'
import { routes } from '@/lib/routes'
import { useDemoTour } from '@/components/demo/DemoTourProvider'

const BANNER_HEIGHT_VAR = '--fixly-demo-banner-h'

function clearBannerHeight() {
  document.documentElement.style.setProperty(BANNER_HEIGHT_VAR, '0px')
}

/**
 * Minimal investor-demo chrome.
 * Keep idle controls light; while the tour runs show only the active step + stop.
 * Hidden on login and marketing/waitlist surfaces so branded/conversion pages stay clean.
 *
 * Publishes --fixly-demo-banner-h so fixed sidebar / sticky headers sit below this bar
 * (otherwise the bar covers the Fixly logo in the desktop sidebar).
 */
export default function DemoModeBanner() {
  const { t } = useLocale()
  const { user, switchDemoRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { tourRunning, tourError, startTour } = useDemoTour()
  const bannerRef = useRef<HTMLDivElement>(null)

  const isMarketingSurface =
    pathname === '/waitlist' ||
    pathname === '/pro/join' ||
    pathname.startsWith('/go/')
  // Keep branded login / splash surfaces clean (OpticalCenter / Bamakor style).
  const isLoginSurface = pathname === '/login'
  const visible =
    isDemoDataMode() && !isMarketingSurface && !isLoginSurface && !tourRunning

  useLayoutEffect(() => {
    if (!visible) {
      clearBannerHeight()
      return
    }
    // Seed reserved height before paint so sticky chrome does not jump (CLS)
    document.documentElement.style.setProperty(BANNER_HEIGHT_VAR, '40px')
    const el = bannerRef.current
    if (!el) return

    const publish = () => {
      document.documentElement.style.setProperty(
        BANNER_HEIGHT_VAR,
        `${el.offsetHeight}px`,
      )
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => {
      ro.disconnect()
      clearBannerHeight()
    }
  }, [visible, tourRunning, tourError])

  if (!visible) return null

  const isPro = user.role === 'professional'

  return (
    <div
      ref={bannerRef}
      className="sticky top-0 z-[60] bg-secondary text-secondary-foreground text-xs font-bold py-1.5 px-3 shadow-sm"
    >
      <div className="flex flex-nowrap items-center justify-center gap-x-3 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <span className="shrink-0">{t('demo.banner')}</span>

        <div className="inline-flex shrink-0 rounded-full border border-secondary-foreground/30 overflow-hidden">
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
          className="underline underline-offset-2 hover:opacity-90 shrink-0"
        >
          {t('demo.tourStart')}
        </button>
      </div>

      {tourError ? (
        <div className="mt-1 text-center font-medium text-red-900 whitespace-normal">
          {tourError}
        </div>
      ) : null}
    </div>
  )
}
