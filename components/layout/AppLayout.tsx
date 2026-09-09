'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'
import BottomNav from '@/components/layout/BottomNav'
import DesktopHeader from '@/components/layout/DesktopHeader'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import NativeAwareMain from '@/components/layout/NativeAwareMain'
import { useDemoTour } from '@/components/demo/DemoTourProvider'
import { shouldShowPrelaunchLanding } from '@/lib/site-hosts'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import { routes } from '@/lib/routes'

type AppLayoutProps = {
  children: ReactNode
  hideNav?: boolean
}

/**
 * Responsive PWA shell.
 * Marketing / pre-launch pages render without product navigation.
 */
export default function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const pathname = usePathname()
  const { tourRunning } = useDemoTour()
  const { switchDemoRole } = useAuth()
  const { t } = useLocale()
  const [host, setHost] = useState('')

  useEffect(() => {
    setHost(window.location.host)
  }, [])

  const isMarketingHome = shouldShowPrelaunchLanding(host) && pathname === '/'
  const isMarketingRoute =
    pathname.startsWith('/go/') ||
    pathname === '/waitlist' ||
    isMarketingHome
  // Full-bleed booking / tracking / investor deep-link
  const isImmersiveRoute =
    pathname.startsWith('/tracking') ||
    pathname.startsWith('/request') ||
    pathname.startsWith('/demo') ||
    pathname === '/login'
  // Pro console only (`/pro` or `/pro/...`) — NOT `/professionals` / `/profile`
  // (those also start with "/pro" and must keep the customer bottom nav).
  const isProConsoleRoute =
    pathname === '/pro' || pathname.startsWith('/pro/')
  const shouldHideChrome = hideNav || isMarketingRoute || isImmersiveRoute
  const shouldHideBottomNav =
    shouldHideChrome || isProConsoleRoute || tourRunning
  const showProDemoExit =
    isDemoDataMode() && isProConsoleRoute && !tourRunning && !shouldHideChrome

  return (
    <div className="min-h-screen bg-background">
      {!shouldHideChrome && <DesktopSidebar />}

      <div className={shouldHideChrome ? '' : 'lg:mr-64 native-shell-column'}>
        {!shouldHideChrome && <DesktopHeader />}

        <NativeAwareMain hideNav={shouldHideBottomNav}>
          {children}
        </NativeAwareMain>
      </div>

      {showProDemoExit && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur safe-area-pb">
          <Link
            href={routes.home}
            onClick={() => switchDemoRole('customer')}
            className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-primary"
          >
            <Home size={16} />
            {t('demo.backHome')}
          </Link>
        </div>
      )}

      {!shouldHideBottomNav && <BottomNav />}
    </div>
  )
}
