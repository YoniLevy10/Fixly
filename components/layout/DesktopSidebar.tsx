'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { primaryNav, secondaryNav } from '@/components/layout/nav-config'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils/cn'

function NavLink({
  path,
  icon: Icon,
  label,
  exact,
}: (typeof primaryNav)[number]) {
  const pathname = usePathname()
  const isActive = exact
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`)

  return (
    <Link
      href={path}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      {label}
    </Link>
  )
}

export default function DesktopSidebar() {
  const router = useRouter()

  return (
    <aside className="hidden lg:flex flex-col fixed top-0 right-0 h-screen w-64 border-l border-border bg-card z-40">
      <div className="p-5 border-b border-border">
        <Link href={routes.home} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm">
            F
          </div>
          <div>
            <p className="font-black text-lg leading-tight">Fixly</p>
            <p className="text-xs text-muted-foreground">תיקונים חכמים</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">תפריט</p>
        {primaryNav.map((item) => (
          <NavLink key={item.path} {...item} />
        ))}

        <p className="text-xs font-semibold text-muted-foreground px-3 mt-6 mb-2">ניהול</p>
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
          + פרסם תקלה
        </button>
      </div>
    </aside>
  )
}
