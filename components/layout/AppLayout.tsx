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

function shouldHideChrome(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/book/success')) return true
  return false
}

/**
 * Responsive PWA shell:
 * - Marketing home: full-bleed, no chrome
 * - App screens: bottom nav / sidebar
 */
export default function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const pathname = usePathname()
  const hideChrome = hideNav || shouldHideChrome(pathname)

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome && <DesktopSidebar />}

      <div className={hideChrome ? '' : 'lg:mr-64 native-shell-column'}>
        {!hideChrome && <DesktopHeader />}

        <NativeAwareMain hideNav={hideChrome}>{children}</NativeAwareMain>
      </div>

      {!hideChrome && <BottomNav />}
    </div>
  )
}
