'use client'

import {
  REQUEST_STATUS_COLORS,
  type RequestStatus,
} from '@/shared/constants/request-status'
import { useLocale } from '@/lib/i18n/locale-provider'
import { cn } from '@/lib/utils/cn'

type RequestStatusBadgeProps = {
  status: RequestStatus
  size?: 'sm' | 'md'
}

export default function RequestStatusBadge({
  status,
  size = 'md',
}: RequestStatusBadgeProps) {
  const { t } = useLocale()
  const label = t(`status.${status}`)
  const colorClass =
    REQUEST_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        colorClass,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
    >
      {label}
    </span>
  )
}
