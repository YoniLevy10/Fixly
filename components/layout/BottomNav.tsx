'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { mobileNav } from '@/components/layout/nav-config'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils/cn'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const renderItem = ({
    path,
    icon: Icon,
    label,
    exact,
  }: (typeof mobileNav)[number]) => {
    const isActive = exact
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`)

    return (
      <Link
        key={path}
        href={path}
        className="flex flex-col items-center gap-0.5 px-4 py-2"
      >
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={cn(isActive ? 'text-primary' : 'text-gray-400')}
        />
        <span
          className={cn(
            'text-xs font-medium',
            isActive ? 'text-primary' : 'text-gray-400'
          )}
        >
          {label}
        </span>
      </Link>
    )
  }

  return (
    <nav className="lg:hidden fixed bottom-0 right-0 left-0 z-50 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
      <div className="flex items-center h-16 px-2 relative max-w-lg mx-auto">
        <div className="flex items-center justify-around flex-1">
          {mobileNav.slice(0, 2).map(renderItem)}
        </div>

        <div className="flex flex-col items-center -mt-5 mx-2">
          <button
            type="button"
            onClick={() => router.push(routes.newRequest)}
            className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-white active:scale-95 transition-transform"
            aria-label="פרסם תקלה"
          >
            <span className="text-2xl font-bold leading-none">+</span>
          </button>
          <span className="text-xs text-gray-400 font-medium mt-0.5">פרסם תקלה</span>
        </div>

        <div className="flex items-center justify-around flex-1">
          {mobileNav.slice(2).map(renderItem)}
        </div>
      </div>
    </nav>
  )
}
