'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import DesktopHeader from '@/components/layout/DesktopHeader'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import NativeAwareMain from '@/components/layout/NativeAwareMain'
import { useDemoTour } from '@/components/demo/DemoTourProvider'
import { shouldShowPrelaunchLanding } from '@/lib/site-hosts'

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
    pathname.startsWith('/demo')
  // Pro console only (`/pro` or `/pro/...`) — NOT `/professionals` / `/profile`
  // (those also start with "/pro" and must keep the customer bottom nav).
  const isProConsoleRoute =
    pathname === '/pro' || pathname.startsWith('/pro/')
  const shouldHideChrome = hideNav || isMarketingRoute || isImmersiveRoute
  const shouldHideBottomNav =
    shouldHideChrome || isProConsoleRoute || tourRunning

  return (
    <div className="min-h-screen bg-background">
      {!shouldHideChrome && <DesktopSidebar />}

      <div className={shouldHideChrome ? '' : 'lg:mr-64 native-shell-column'}>
        {!shouldHideChrome && <DesktopHeader />}

        <NativeAwareMain hideNav={shouldHideBottomNav}>
          {children}
        </NativeAwareMain>
      </div>

      {!shouldHideBottomNav && <BottomNav />}
    </div>
  )
}
