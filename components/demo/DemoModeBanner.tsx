'use client'

import Link from 'next/link'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useLocale } from '@/lib/i18n/locale-provider'
import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { routes } from '@/lib/routes'

export default function DemoModeBanner() {
  const { t } = useLocale()

  if (!isDemoDataMode()) return null

  return (
    <div className="bg-secondary text-secondary-foreground text-center text-xs font-bold py-1.5 px-3 z-[60] relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span>{t('demo.banner')}</span>
      <Link
        href={`${routes.newRequest}?professional=${DEMO_PROFESSIONAL_ID}`}
        className="underline underline-offset-2 hover:opacity-90"
      >
        {t('demo.bannerCta')}
      </Link>
    </div>
  )
}
