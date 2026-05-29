import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
} from '@/shared/constants/request-status'
import { cn } from '@/lib/utils/cn'

type RequestStatusBadgeProps = {
  status: RequestStatus
  size?: 'sm' | 'md'
}

export default function RequestStatusBadge({
  status,
  size = 'md',
}: RequestStatusBadgeProps) {
  const label = REQUEST_STATUS_LABELS[status] ?? status
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
