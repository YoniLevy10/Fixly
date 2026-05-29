'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import ProPricingPlans from '@/components/billing/ProPricingPlans'
import BackButton from '@/components/shared/BackButton'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function ProPricingPage() {
  const router = useRouter()
  const { t } = useLocale()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <BackButton onClick={() => router.back()} />
        <h1 className="text-xl font-black">Fixly Pro</h1>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">{t('common.loading')}</p>}>
        <ProPricingPlans />
      </Suspense>
    </div>
  )
}
