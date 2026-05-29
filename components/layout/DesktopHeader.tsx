'use client'

import { useAuth } from '@/lib/auth/auth-provider'
import Link from 'next/link'
import { routes } from '@/lib/routes'

export default function DesktopHeader() {
  const { user } = useAuth()

  return (
    <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30">
      <div>
        <p className="text-sm text-muted-foreground">שלום,</p>
        <p className="font-bold">{user.fullName}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={routes.profile}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm"
        >
          {user.fullName.charAt(0)}
        </Link>
      </div>
    </header>
  )
}
