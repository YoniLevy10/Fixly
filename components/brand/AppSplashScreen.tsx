'use client'

import { FixlyMark } from '@/components/brand/FixlyMark'
import { cn } from '@/lib/utils/cn'

type AppSplashScreenProps = {
  /** Hebrew label under the logo */
  label?: string
  /** Compact = inline BrandSplash; full = boot / entry screen */
  variant?: 'full' | 'compact'
  className?: string
}

/**
 * Branded entry splash — Bamakor AppSplashScreen pattern:
 * Fixly logo centered + animated loading line.
 * Used while auth/session boots so the app doesn't flash bare chrome.
 */
export default function AppSplashScreen({
  label = 'טוען…',
  variant = 'full',
  className,
}: AppSplashScreenProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 py-16',
          className,
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
      >
        <FixlyMark size={72} priority className="rounded-2xl shadow-md" />
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <SplashProgressLine />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixly-app-splash fixed inset-0 z-[100] flex flex-col items-center justify-center',
        'bg-[#123563] text-white',
        'pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-[#F59E0B]/15 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6">
        <div className="fixly-splash-mark-pop">
          {/* Plain <img> so the mark paints on first frame (no Next Image decode delay). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/fixly-icon.svg"
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 rounded-[1.75rem] shadow-lg ring-1 ring-white/20"
            decoding="sync"
            fetchPriority="high"
          />
        </div>

        <div className="text-center" dir="ltr">
          <p className="text-3xl font-black tracking-tight">
            Fixly
            <span className="text-[#F59E0B]">.</span>
          </p>
          <p className="mt-1 text-sm font-medium text-white/70" dir="rtl">
            תחזוקה חכמה
          </p>
        </div>

        <div className="mt-2 flex w-44 flex-col items-center gap-3">
          <SplashProgressLine tone="on-dark" />
          <p className="text-xs font-medium text-white/60">{label}</p>
        </div>
      </div>
    </div>
  )
}

function SplashProgressLine({
  tone = 'on-light',
}: {
  tone?: 'on-light' | 'on-dark'
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'fixly-splash-track relative block h-1.5 w-full overflow-hidden rounded-full',
        tone === 'on-dark' ? 'bg-white/20' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'fixly-splash-bar absolute inset-y-0 start-0 w-1/2 rounded-full',
          tone === 'on-dark' ? 'bg-[#F59E0B]' : 'bg-secondary',
        )}
      />
    </span>
  )
}
