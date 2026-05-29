import { cn } from '@/lib/utils/cn'
import type { InputHTMLAttributes } from 'react'

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm text-foreground font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-foreground/40',
        className
      )}
      {...props}
    />
  )
}
