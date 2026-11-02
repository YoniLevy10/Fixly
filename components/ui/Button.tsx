'use client'

import { cn } from '@/lib/utils/cn'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary = amber CTA · secondary = navy outline · outline = soft navy pill */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary:
    'bg-secondary text-secondary-foreground shadow-md shadow-secondary/25 hover:brightness-105 border border-secondary/80',
  secondary:
    'bg-transparent text-primary border-2 border-primary/25 hover:bg-primary/5 hover:border-primary/40',
  success:
    'bg-success text-success-foreground shadow-md shadow-success/20 hover:brightness-105 border border-success/80',
  danger:
    'bg-destructive text-destructive-foreground shadow-md hover:brightness-105 border border-destructive/80',
  outline:
    'bg-card text-primary border border-border hover:border-primary/35 hover:bg-primary/5',
  ghost: 'bg-transparent text-foreground hover:bg-muted border border-transparent',
}

const sizes = {
  sm: 'min-h-[40px] px-3 py-2 text-sm rounded-xl',
  md: 'min-h-[48px] px-4 py-2.5 text-base rounded-xl',
  lg: 'min-h-[var(--tap)] px-5 py-3 text-base rounded-[var(--radius-lg)]',
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
        'inline-flex items-center justify-center gap-2 font-extrabold transition-all duration-[var(--dur-1)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
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
