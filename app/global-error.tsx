'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

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

  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 font-sans">
        <h1 className="text-xl font-semibold">משהו השתבש</h1>
        <p className="text-muted-foreground text-center text-sm">
          הצוות שלנו קיבל התראה. נסה לרענן את הדף.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          נסה שוב
        </button>
      </body>
    </html>
  )
}
