'use client'

import { ShieldCheck } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function VerifiedBadge({ className = '' }: { className?: string }) {
  const { t } = useLocale()
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-300 ${className}`}
    >
      <ShieldCheck size={12} />
      {t('trust.verified')}
    </span>
  )
}
