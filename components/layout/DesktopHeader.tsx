'use client'

import { useAuth } from '@/lib/auth/auth-provider'
import Link from 'next/link'
import { routes } from '@/lib/routes'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function DesktopHeader() {
  const { user } = useAuth()
  const { t } = useLocale()

  return (
    <header className="fixly-desktop-header native-hide-desktop hidden lg:flex items-center justify-between h-16 px-8 sticky top-[var(--fixly-demo-banner-h,0px)] z-30 apple-glass border-b border-border">
      <div>
        <p className="text-sm text-muted-foreground">{t('nav.hello')},</p>
        <p className="font-extrabold text-foreground">{user.fullName}</p>
      </div>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <Link
          href={routes.profile}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-sm"
        >
          {user.fullName.charAt(0)}
        </Link>
      </div>
    </header>
  )
}
