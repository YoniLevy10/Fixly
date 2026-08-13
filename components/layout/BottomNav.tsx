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
          'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors',
          isActive && 'bg-primary/15'
        )}
      >
        {showBadge && (
          <span className="absolute top-0 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={cn(isActive ? 'text-primary' : 'text-foreground/45')}
        />
        <span
          className={cn(
            'text-xs font-bold',
            isActive ? 'text-primary' : 'text-foreground/50'
          )}
        >
          {t(labelKey)}
        </span>
      </Link>
    )
  }

  return (
    <nav className="native-bottom-nav lg:hidden fixed bottom-0 right-0 left-0 z-50 bg-card border-t-2 border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
      <div className="flex items-center h-16 px-2 relative max-w-lg mx-auto">
        <div className="flex items-center justify-around flex-1">
          {mobileNav.slice(0, 2).map(renderItem)}
        </div>

        <div className="flex flex-col items-center -mt-5 mx-2">
          <button
            type="button"
            onClick={() => router.push(routes.professionals)}
            className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg shadow-secondary/40 border-4 border-card ring-2 ring-secondary/25 active:scale-95 transition-transform"
            aria-label={t('common.publishIssue')}
          >
            <span className="text-2xl font-bold leading-none">+</span>
          </button>
          <span className="text-xs text-secondary font-bold mt-0.5">
            {t('common.publishIssue')}
          </span>
        </div>

        <div className="flex items-center justify-around flex-1">
          {mobileNav.slice(2).map(renderItem)}
        </div>
      </div>
    </nav>
  )
}
