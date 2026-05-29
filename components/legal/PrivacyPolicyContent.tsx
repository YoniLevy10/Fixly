'use client'

import LegalPageLayout from '@/components/legal/LegalPageLayout'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function PrivacyPolicyContent() {
  const { t } = useLocale()

  return (
    <LegalPageLayout title={t('legal.privacyTitle')} lastUpdated={t('legal.lastUpdated')}>
      <p>{t('legal.privacyIntro')}</p>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.dataWeCollect')}</h2>
        <ul className="list-disc ps-5 space-y-1">
          <li>{t('legal.dataAccount')}</li>
          <li>{t('legal.dataRequests')}</li>
          <li>{t('legal.dataPhotos')}</li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.howWeUse')}</h2>
        <p>{t('legal.howWeUseBody')}</p>
      </section>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.storage')}</h2>
        <p>{t('legal.storageBody')}</p>
      </section>
      <section>
        <h2 className="font-bold text-base mb-2">{t('legal.contact')}</h2>
        <p>{t('legal.contactBody')}</p>
      </section>
    </LegalPageLayout>
  )
}
