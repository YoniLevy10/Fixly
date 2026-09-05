'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import DesktopHeader from '@/components/layout/DesktopHeader'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import NativeAwareMain from '@/components/layout/NativeAwareMain'
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
  const [host, setHost] = useState('')

  useEffect(() => {
    setHost(window.location.host)
  }, [])

  const isMarketingHome = shouldShowPrelaunchLanding(host) && pathname === '/'
  const isMarketingRoute =
    pathname.startsWith('/go/') ||
    pathname === '/waitlist' ||
    isMarketingHome
  // Immersive booking / tracking / investor tour — bottom nav must not cover CTAs
  const isImmersiveRoute =
    pathname.startsWith('/tracking') ||
    pathname.startsWith('/request') ||
    pathname.startsWith('/demo')
  const shouldHideNav = hideNav || isMarketingRoute || isImmersiveRoute

  return (
    <div className="min-h-screen bg-background">
      {!shouldHideNav && <DesktopSidebar />}

      <div className={shouldHideNav ? '' : 'lg:mr-64 native-shell-column'}>
        {!shouldHideNav && <DesktopHeader />}

        <NativeAwareMain hideNav={shouldHideNav}>{children}</NativeAwareMain>
      </div>

      {!shouldHideNav && <BottomNav />}
    </div>
  )
}
