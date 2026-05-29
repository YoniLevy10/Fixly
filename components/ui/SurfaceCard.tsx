import { cn } from '@/lib/utils/cn'

type SurfaceCardProps = {
  children: React.ReactNode
  className?: string
  accent?: 'none' | 'primary' | 'secondary' | 'success' | 'warning' | 'info'
  padding?: 'sm' | 'md' | 'lg'
}

const accentBar = {
  none: '',
  primary: 'border-s-4 border-s-primary',
  secondary: 'border-s-4 border-s-secondary',
  success: 'border-s-4 border-s-success',
  warning: 'border-s-4 border-s-warning',
  info: 'border-s-4 border-s-info',
}

const paddingMap = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export default function SurfaceCard({
  children,
  className,
  accent = 'none',
  padding = 'md',
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-2xl border-2 border-border shadow-md',
        accentBar[accent],
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
