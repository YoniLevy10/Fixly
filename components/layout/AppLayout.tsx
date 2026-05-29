import type { ReactNode } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import DesktopHeader from '@/components/layout/DesktopHeader'
import DesktopSidebar from '@/components/layout/DesktopSidebar'

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

      <div className={hideNav ? '' : 'lg:mr-64'}>
        {!hideNav && <DesktopHeader />}

        <main
          className={
            hideNav
              ? 'min-h-screen'
              : 'min-h-screen pb-24 lg:pb-8 px-0 lg:px-8'
          }
        >
          <div className="w-full mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {!hideNav && <BottomNav />}
    </div>
  )
}
