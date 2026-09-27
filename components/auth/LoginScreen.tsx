'use client'

import Link from 'next/link'
import { FixlyMark } from '@/components/brand/FixlyMark'
import AuthPanel from '@/components/auth/AuthPanel'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'

/**
 * Dedicated login surface — iOS 27 glass + Fixly navy/orange brand.
 */
export default function LoginScreen() {
  const { t } = useLocale()

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center ios27-atmosphere px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px] animate-ios-scale-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <FixlyMark size={72} priority className="mb-4 rounded-[var(--radius-lg)] shadow-lg shadow-primary/20" />
          <h1 className="text-2xl font-black tracking-tight text-primary" dir="ltr">
            Fixly<span className="text-secondary">.</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {t('auth.signInPromptTitle')}
          </p>
        </div>

        <div className="apple-glass-strong rounded-[var(--radius-xl)] p-1">
          <div className="rounded-[calc(var(--radius-xl)-4px)] bg-card/90 p-4 sm:p-5">
            <AuthPanel />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href={routes.home}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {t('common.back')} · Fixly
          </Link>
        </p>
      </div>
    </div>
  )
}
