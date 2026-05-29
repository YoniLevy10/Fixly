import { cn } from '@/lib/utils/cn'
import type { LabelHTMLAttributes } from 'react'

export default function Label({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
    </label>
  )
}
