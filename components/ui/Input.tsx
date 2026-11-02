import { cn } from '@/lib/utils/cn'
import type { InputHTMLAttributes } from 'react'

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full min-h-[var(--tap)] rounded-xl border border-border bg-card px-4 py-2.5 text-base text-foreground font-medium outline-none',
        'transition-colors duration-[var(--dur-1)]',
        'placeholder:text-muted-foreground/70',
        'focus:border-primary focus:ring-2 focus:ring-primary/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}
