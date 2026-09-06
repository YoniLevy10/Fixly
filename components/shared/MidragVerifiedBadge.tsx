'use client'

import { BadgeCheck } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'

/** Midrag (מידרג) verification chip — shown on demo + linked pro profiles. */
export default function MidragVerifiedBadge({
  className = '',
}: {
  className?: string
}) {
  const { t } = useLocale()
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full ring-1 ring-sky-300 ${className}`}
      title={t('trust.midragVerifiedHint')}
    >
      <BadgeCheck size={12} />
      {t('trust.midragVerified')}
    </span>
  )
}
