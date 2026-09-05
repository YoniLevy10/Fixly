'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { useAuth } from '@/lib/auth/auth-provider'
import { runInvestorDemoTour } from '@/lib/demo/investor-tour'
import { useLocale } from '@/lib/i18n/locale-provider'

/**
 * Investor deep-link: https://fixly.tech/demo
 * Auto-starts the end-to-end platform tour.
 */
export default function InvestorDemoPage() {
  const router = useRouter()
  const { switchDemoRole } = useAuth()
  const { t } = useLocale()
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !isDemoDataMode()) return
    started.current = true

    const ac = new AbortController()
    void runInvestorDemoTour({
      switchRole: switchDemoRole,
      navigate: (path) => router.push(path),
      signal: ac.signal,
    }).catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('[investor-demo]', err)
      router.replace('/')
    })

    return () => ac.abort()
  }, [router, switchDemoRole])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-10 h-10 border-4 border-muted border-t-secondary rounded-full animate-spin" />
      <h1 className="text-xl font-black">{t('demo.tourStart')}</h1>
      <p className="text-sm text-foreground/70 max-w-sm">
        {t('demo.tourRunning')} — {t('demo.banner')}
      </p>
    </div>
  )
}
