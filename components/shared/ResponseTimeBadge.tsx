'use client'

import { Clock } from 'lucide-react'
import { formatResponseTime } from '@/lib/matching/response-time'
import { useLocale } from '@/lib/i18n/locale-provider'

type ResponseTimeBadgeProps = {
  avgResponseMinutes?: number | null
  className?: string
}

export default function ResponseTimeBadge({
  avgResponseMinutes,
  className = '',
}: ResponseTimeBadgeProps) {
  const { locale } = useLocale()
  const label = formatResponseTime(avgResponseMinutes, locale)
  if (!label) return null

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full ${className}`}
    >
      <Clock size={11} />
      {label}
    </span>
  )
}
