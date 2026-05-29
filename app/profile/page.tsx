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
      <h1 className="text-2xl font-black mb-6 lg:text-3xl">{t('profile.title')}</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
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
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          {t('profile.myRequests')}
        </Link>
        <Link
          href={routes.professionals}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          {t('profile.findPros')}
        </Link>
        <Link
          href={routes.proJoin}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          {t('improvements.proJoin')}
        </Link>
        <Link
          href={routes.about}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          {t('improvements.about')}
        </Link>
        <Link
          href={routes.proPricing}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          Fixly Pro
        </Link>
        <Link
          href={routes.proDashboard}
          className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 font-medium hover:border-primary/30"
        >
          {t('profile.proDashboard')}
        </Link>
        <Link
          href={routes.newRequest}
          className="block bg-secondary text-white rounded-2xl px-4 py-3 font-bold text-center"
        >
          {t('profile.sendNew')}
        </Link>
      </nav>
    </div>
  )
}
