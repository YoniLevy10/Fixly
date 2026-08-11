'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect, useMemo } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isHe = useMemo(() => {
    if (typeof document === 'undefined') return true
    const lang = document.documentElement.lang || 'he'
    return lang.toLowerCase().startsWith('he')
  }, [])

  const copy = isHe
    ? {
        title: 'משהו השתבש',
        body: 'הצוות שלנו קיבל התראה. נסה לרענן את הדף.',
        retry: 'נסה שוב',
        lang: 'he',
        dir: 'rtl' as const,
      }
    : {
        title: 'Something went wrong',
        body: 'Our team has been notified. Try refreshing the page.',
        retry: 'Try again',
        lang: 'en',
        dir: 'ltr' as const,
      }

  return (
    <html lang={copy.lang} dir={copy.dir}>
      <body className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 font-sans">
        <h1 className="text-xl font-semibold">{copy.title}</h1>
        <p className="text-muted-foreground text-center text-sm">{copy.body}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {copy.retry}
        </button>
      </body>
    </html>
  )
}
