'use client'

import LegalPageLayout from '@/components/legal/LegalPageLayout'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function TermsContent() {
  const { t } = useLocale()

  return (
    <LegalPageLayout title={t('legal.termsTitle')} lastUpdated={t('legal.lastUpdated')}>
      <p>{t('legal.termsIntro')}</p>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.termsService')}</h2>
        <p>{t('legal.termsServiceBody')}</p>
      </section>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.termsPros')}</h2>
        <p>{t('legal.termsProsBody')}</p>
      </section>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.termsLiability')}</h2>
        <p>{t('legal.termsLiabilityBody')}</p>
      </section>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.contact')}</h2>
        <p>{t('legal.contactBody')}</p>
      </section>
    </LegalPageLayout>
  )
}
