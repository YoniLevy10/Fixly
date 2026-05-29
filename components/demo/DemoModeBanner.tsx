'use client'

import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function DemoModeBanner() {
  const { t } = useLocale()

  if (!isDemoDataMode()) return null

  return (
    <div className="bg-secondary text-secondary-foreground text-center text-xs font-bold py-1.5 px-3 z-[60] relative">
      {t('demo.banner')}
    </div>
  )
}
