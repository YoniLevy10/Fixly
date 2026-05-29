'use client'

import { cn } from '@/lib/utils/cn'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 border-2 border-primary',
  secondary:
    'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 hover:brightness-105 border-2 border-secondary',
  success:
    'bg-success text-success-foreground shadow-lg shadow-success/25 hover:brightness-105 border-2 border-success',
  danger:
    'bg-destructive text-destructive-foreground shadow-md hover:brightness-105 border-2 border-destructive',
  outline:
    'bg-white text-primary border-2 border-primary hover:bg-primary/5',
  ghost: 'bg-transparent text-foreground hover:bg-muted border-2 border-transparent',
}

const sizes = {
  sm: 'min-h-[40px] px-3 py-2 text-sm rounded-xl',
  md: 'min-h-[48px] px-4 py-2.5 text-base rounded-xl',
  lg: 'min-h-[52px] px-5 py-3 text-base rounded-2xl',
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
