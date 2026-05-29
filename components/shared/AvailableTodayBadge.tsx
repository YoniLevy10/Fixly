'use client'

import { useLocale } from '@/lib/i18n/locale-provider'

type AvailableTodayBadgeProps = {
  isAvailable: boolean
}

export default function AvailableTodayBadge({ isAvailable }: AvailableTodayBadgeProps) {
  const { t } = useLocale()
  if (!isAvailable) return null
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5">
      {t('improvements.availableToday')}
    </span>
  )
}
