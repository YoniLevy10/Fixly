'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { mobileNav } from '@/components/layout/nav-config'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'
import { useAuth } from '@/lib/auth/auth-provider'
import { usePendingRequestsCount } from '@/shared/hooks/use-pending-requests-count'
import { cn } from '@/lib/utils/cn'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLocale()
  const { user } = useAuth()
  const pendingCount = usePendingRequestsCount()

  const renderItem = ({
    path,
    icon: Icon,
    labelKey,
    exact,
  }: (typeof mobileNav)[number]) => {
    const isActive = exact
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`)

    const showBadge =
      path === routes.profile && user.role === 'professional' && pendingCount > 0

    return (
      <Link
        key={path}
        href={path}
        className={cn(
          'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors duration-[var(--dur-1)]',
          isActive && 'nav-pill-active'
        )}
      >
        {showBadge && (
          <span className="absolute top-0 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-white z-[2]">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={cn(
            'relative z-[1]',
            isActive ? 'text-primary' : 'text-foreground/45'
          )}
        />
        <span
          className={cn(
            'relative z-[1] text-[11px] font-bold',
            isActive ? 'text-primary' : 'text-foreground/50'
          )}
        >
          {t(labelKey)}
        </span>
      </Link>
    )
  }

  return (
    <nav className="native-bottom-nav lg:hidden fixed bottom-3 inset-x-3 z-50 mx-auto max-w-lg">
      <div className="apple-glass rounded-[var(--radius-xl)] safe-area-pb">
        <div className="flex items-center h-16 px-2 relative">
          <div className="flex items-center justify-around flex-1">
            {mobileNav.slice(0, 2).map(renderItem)}
          </div>

          <div className="flex flex-col items-center -mt-6 mx-2">
            <button
              type="button"
              onClick={() => router.push(routes.quickRequest)}
              className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg shadow-secondary/35 border-[3px] border-white/80 active:scale-95 transition-transform duration-[var(--dur-1)]"
              aria-label={t('common.publishIssue')}
            >
              <span className="text-2xl font-bold leading-none">+</span>
            </button>
          </div>

          <div className="flex items-center justify-around flex-1">
            {mobileNav.slice(2).map(renderItem)}
          </div>
        </div>
      </div>
    </nav>
  )
}
