import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  /** Prefer a lucide icon or custom node; string emoji still accepted */
  icon?: ReactNode
  className?: string
  action?: ReactNode
}

export default function EmptyState({
  title,
  description,
  icon,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'ios27-surface px-6 py-10 sm:px-8 sm:py-12 text-center',
        className
      )}
      role="status"
    >
      {icon != null ? (
        <div className="mb-4 flex justify-center text-4xl text-muted-foreground" aria-hidden>
          {icon}
        </div>
      ) : null}

      <h3 className="m-0 text-xl font-extrabold text-foreground sm:text-2xl">{title}</h3>

      <p className="mx-auto mt-2 mb-0 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>

      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
