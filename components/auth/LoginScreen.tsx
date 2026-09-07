'use client'

import Link from 'next/link'
import { FixlyMark } from '@/components/brand/FixlyMark'
import AuthPanel from '@/components/auth/AuthPanel'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'

/**
 * Dedicated login surface — OpticalCenter / Moked pattern:
 * brand mark first, then auth form. Full-bleed product chrome hidden via AppLayout immersive routes.
 */
export default function LoginScreen() {
  const { t } = useLocale()

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#f7f9fc] px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-[#ffd98e]/40 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-64 w-64 rounded-full bg-[#bfd6f0]/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <FixlyMark size={72} priority className="mb-4 rounded-2xl shadow-md" />
          <h1 className="text-2xl font-black tracking-tight text-[#123563]" dir="ltr">
            Fixly<span className="text-[#F59E0B]">.</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {t('auth.signInPromptTitle')}
          </p>
        </div>

        <AuthPanel />

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
