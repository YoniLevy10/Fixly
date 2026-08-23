'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import DesktopHeader from '@/components/layout/DesktopHeader'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import NativeAwareMain from '@/components/layout/NativeAwareMain'

type AppLayoutProps = {
  children: ReactNode
  hideNav?: boolean
}

/**
 * Responsive PWA shell. Campaign landing pages under /go intentionally render
 * without product navigation so paid traffic gets one focused conversion path.
 */
export default function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const pathname = usePathname()
  const shouldHideNav = hideNav || pathname.startsWith('/go/')

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
