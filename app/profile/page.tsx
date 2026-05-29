'use client'

import Link from 'next/link'
import AuthPanel from '@/components/auth/AuthPanel'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function ProfilePage() {
  const { t } = useLocale()

  return (
    <div className="px-4 py-6 max-w-lg mx-auto lg:max-w-2xl lg:px-8">
      <h1 className="fixly-page-title mb-6">{t('profile.title')}</h1>

      <div className="bg-card rounded-2xl border-2 border-border p-4 mb-6 shadow-sm">
        <LanguageSwitcher />
      </div>

      <AuthPanel />

      <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {t('legal.mobileApp')}
        </p>
        <Link
          href={routes.privacy}
          className="block text-sm text-gray-600 hover:text-primary"
        >
          {t('legal.privacyLink')}
        </Link>
        <Link
          href={routes.terms}
          className="block text-sm text-gray-600 hover:text-primary"
        >
          {t('legal.termsLink')}
        </Link>
      </div>

      <nav className="space-y-2 mt-6 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        <Link
          href={routes.myRequests}
          className="fixly-link-card border-s-4 border-s-sky-500"
        >
          {t('profile.myRequests')}
        </Link>
        <Link
          href={routes.professionals}
          className="fixly-link-card border-s-4 border-s-violet-500"
        >
          {t('profile.findPros')}
        </Link>
        <Link
          href={routes.proJoin}
          className="fixly-link-card border-s-4 border-s-emerald-500"
        >
          {t('improvements.proJoin')}
        </Link>
        <Link
          href={routes.about}
          className="fixly-link-card border-s-4 border-s-gray-400"
        >
          {t('improvements.about')}
        </Link>
        <Link
          href={routes.proPricing}
          className="fixly-link-card border-s-4 border-s-secondary bg-secondary/10"
        >
          Fixly Pro
        </Link>
        <Link
          href={routes.proDashboard}
          className="fixly-link-card border-s-4 border-s-primary"
        >
          {t('profile.proDashboard')}
        </Link>
        <Link
          href={routes.newRequest}
          className="block col-span-full bg-secondary text-secondary-foreground rounded-2xl px-4 py-4 font-bold text-center shadow-lg border-2 border-secondary lg:col-span-2"
        >
          {t('profile.sendNew')}
        </Link>
      </nav>
    </div>
  )
}
