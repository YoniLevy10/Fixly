'use client'

import Link from 'next/link'
import LegalPageLayout from '@/components/legal/LegalPageLayout'
import { APP_STORE_CONFIG } from '@/lib/mobile/app-store-config'
import { useLocale } from '@/lib/i18n/locale-provider'
import { routes } from '@/lib/routes'

export default function AboutContent() {
  const { t } = useLocale()

  return (
    <LegalPageLayout title={t('improvements.about')} lastUpdated="">
      <p className="font-bold text-lg">{t('app.name')}</p>
      <p className="text-muted-foreground">{t('app.tagline')}</p>
      <p>
        {t('improvements.version')}: {APP_STORE_CONFIG.version} (
        {APP_STORE_CONFIG.buildNumber})
      </p>
      <p>{t('app.description')}</p>
      <ul className="list-disc ps-5 space-y-1">
        <li>
          <Link href={routes.privacy} className="text-primary underline">
            {t('legal.privacyLink')}
          </Link>
        </li>
        <li>
          <Link href={routes.terms} className="text-primary underline">
            {t('legal.termsLink')}
          </Link>
        </li>
        <li>
          <Link href={routes.proJoin} className="text-primary underline">
            {t('improvements.proJoin')}
          </Link>
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">support@fixly.app</p>
    </LegalPageLayout>
  )
}
