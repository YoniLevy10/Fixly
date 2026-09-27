'use client'

import { cn } from '@/lib/utils/cn'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 border border-primary/80',
  secondary:
    'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 hover:brightness-105 border border-secondary/80',
  success:
    'bg-success text-success-foreground shadow-lg shadow-success/25 hover:brightness-105 border border-success/80',
  danger:
    'bg-destructive text-destructive-foreground shadow-md hover:brightness-105 border border-destructive/80',
  outline:
    'apple-glass-pill text-primary border border-primary/30 hover:bg-primary/5',
  ghost: 'bg-transparent text-foreground hover:bg-muted border border-transparent',
}

const sizes = {
  sm: 'min-h-[40px] px-3 py-2 text-sm rounded-2xl',
  md: 'min-h-[48px] px-4 py-2.5 text-base rounded-2xl',
  lg: 'min-h-[52px] px-5 py-3 text-base rounded-[var(--radius-lg)]',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
