import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

/**
 * Bamakor / OpticalCenter pattern: one brand mark reused in shell, splash, login, offline.
 * Assets live under /public/brand for stable PWA + Capacitor URLs.
 */
const MARK_SRC = '/brand/fixly-mark.png'
const MARK_SVG = '/brand/fixly-icon.svg'
const LOGO_SRC = '/brand/fixly-logo.svg'

export type FixlyMarkSize = 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 80 | 96 | 112

const SIZE_CLASS: Record<FixlyMarkSize, string> = {
  28: 'h-7 w-7',
  32: 'h-8 w-8',
  36: 'h-9 w-9',
  40: 'h-10 w-10',
  48: 'h-12 w-12',
  56: 'h-14 w-14',
  64: 'h-16 w-16',
  72: 'h-[4.5rem] w-[4.5rem]',
  80: 'h-20 w-20',
  96: 'h-24 w-24',
  112: 'h-28 w-28',
}

export function FixlyMark({
  size = 40,
  className,
  priority,
  alt = 'Fixly',
  /** Prefer raster for Image optimization; svg for crisp vector when needed. */
  format = 'png',
}: {
  size?: FixlyMarkSize
  className?: string
  priority?: boolean
  alt?: string
  format?: 'png' | 'svg'
}) {
  const src = format === 'svg' ? MARK_SVG : MARK_SRC
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      unoptimized={format === 'svg'}
      className={cn(
        SIZE_CLASS[size],
        'shrink-0 rounded-2xl object-cover shadow-sm',
        className,
      )}
    />
  )
}

/** Wordmark (icon + Fixly) for splash / login hero. */
export function FixlyLogo({
  className,
  priority,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Fixly"
      width={320}
      height={80}
      priority={priority}
      unoptimized
      className={cn('h-auto w-[160px] object-contain md:w-[200px]', className)}
    />
  )
}

/**
 * Lightweight loading splash — Bamakor AppSplashScreen pattern
 * (logo + short label + progress line), as adopted in OpticalCenter BrandSplash.
 */
export function BrandSplash({
  label = 'Fixly',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center gap-4 py-12',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <FixlyMark size={80} priority className="rounded-2xl shadow-md" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <span
        aria-hidden
        className="fixly-splash-track h-1 w-16 overflow-hidden rounded-full bg-muted"
      >
        <span className="fixly-splash-bar block h-full w-1/2 rounded-full bg-secondary" />
      </span>
    </div>
  )
}
