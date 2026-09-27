'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FixlyMark } from '@/components/brand/FixlyMark'
import { primaryNav, secondaryNav } from '@/components/layout/nav-config'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'
import { cn } from '@/lib/utils/cn'

function NavLink({
  path,
  icon: Icon,
  labelKey,
  exact,
}: (typeof primaryNav)[number]) {
  const { t } = useLocale()
  const pathname = usePathname()
  const isActive = exact
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`)

  return (
    <Link
      href={path}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-1)]',
        isActive
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
          : 'text-muted-foreground hover:bg-primary/8 hover:text-foreground'
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      {t(labelKey)}
    </Link>
  )
}

export default function DesktopSidebar() {
  const router = useRouter()
  const { t } = useLocale()

  return (
    <aside className="fixly-desktop-sidebar native-hide-desktop hidden lg:flex flex-col fixed top-[var(--fixly-demo-banner-h,0px)] right-0 h-[calc(100dvh-var(--fixly-demo-banner-h,0px))] w-64 border-l border-border/40 apple-glass z-40">
      <div className="p-5 border-b border-border/40">
        <Link href={routes.home} className="flex items-center gap-3">
          <FixlyMark size={40} className="rounded-2xl shadow-md shadow-primary/15" />
          <div>
            <p className="font-black text-lg leading-tight">{t('app.name')}</p>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">{t('nav.menu')}</p>
        {primaryNav.map((item) => (
          <NavLink key={item.path} {...item} />
        ))}

        <p className="text-xs font-semibold text-muted-foreground px-3 mt-6 mb-2">{t('nav.manage')}</p>
        {secondaryNav.map((item) => (
          <NavLink key={item.path} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.push(routes.newRequest)}
          className="w-full bg-secondary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          + {t('common.publishIssue')}
        </button>
      </div>
    </aside>
  )
}
