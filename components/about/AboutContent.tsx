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
      <p className="font-bold text-lg">Fixly</p>
      <p className="text-muted-foreground">{t('app.tagline')}</p>
      <p>{t('improvements.aboutLead')}</p>

      <h2 className="text-base font-black pt-2">{t('improvements.aboutHowTitle')}</h2>
      <ul className="list-disc ps-5 space-y-1">
        <li>{t('improvements.aboutHow1')}</li>
        <li>{t('improvements.aboutHow2')}</li>
        <li>{t('improvements.aboutHow3')}</li>
      </ul>

      <h2 className="text-base font-black pt-2">{t('improvements.aboutIntentTitle')}</h2>
      <p>{t('improvements.aboutIntentBody')}</p>

      <div className="flex flex-col sm:flex-row gap-2 pt-2 not-prose">
        <Link
          href={`${routes.waitlist}?utm_source=fixly&utm_medium=organic&utm_campaign=about`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
        >
          {t('improvements.aboutWaitlistCta')}
        </Link>
        <Link
          href={`${routes.waitlist}?audience=professional&utm_source=fixly&utm_medium=organic&utm_campaign=about_pro`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/20 px-5 text-sm font-bold text-primary"
        >
          {t('improvements.aboutProCta')}
        </Link>
      </div>

      <p>
        {t('improvements.version')}: {APP_STORE_CONFIG.version} (
        {APP_STORE_CONFIG.buildNumber})
      </p>
      <p>{t('app.description')}</p>
      <ul className="list-disc ps-5 space-y-1">
        <li>
          <Link href={routes.waitlist} className="text-primary underline">
            {t('improvements.aboutWaitlistCta')}
          </Link>
        </li>
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
      </ul>
      <p className="text-sm text-muted-foreground">support@fixly.app</p>
    </LegalPageLayout>
  )
}
