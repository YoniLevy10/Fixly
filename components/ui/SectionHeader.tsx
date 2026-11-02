import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  action?: ReactNode
  className?: string
}

export default function SectionHeader({
  title,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex items-center justify-between gap-3',
        className
      )}
    >
      <h2 className="fixly-section-title m-0">{title}</h2>

      {action != null ? (
        typeof action === 'string' ? (
          <span className="text-sm font-bold text-primary">{action}</span>
        ) : (
          action
        )
      ) : null}
    </div>
  )
}
