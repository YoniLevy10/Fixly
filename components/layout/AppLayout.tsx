import type { ReactNode } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import DesktopHeader from '@/components/layout/DesktopHeader'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import NativeAwareMain from '@/components/layout/NativeAwareMain'

type AppLayoutProps = {
  children: ReactNode
  hideNav?: boolean
}

/**
 * Responsive PWA shell:
 * - Mobile / tablet: bottom navigation, full-width content
 * - Desktop (lg+): fixed sidebar + header, centered content up to 6xl
 */
export default function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {!hideNav && <DesktopSidebar />}

      <div className={hideNav ? '' : 'lg:mr-64 native-shell-column'}>
        {!hideNav && <DesktopHeader />}

        <NativeAwareMain hideNav={hideNav}>{children}</NativeAwareMain>
      </div>

      {!hideNav && <BottomNav />}
    </div>
  )
}
