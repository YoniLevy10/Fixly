'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import DesktopHeader from '@/components/layout/DesktopHeader'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import NativeAwareMain from '@/components/layout/NativeAwareMain'
import { featureFlags } from '@/lib/feature-flags'

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
  const isMarketingRoute =
    pathname.startsWith('/go/') ||
    pathname === '/waitlist' ||
    (featureFlags.prelaunch && pathname === '/')
  const shouldHideNav = hideNav || isMarketingRoute

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
