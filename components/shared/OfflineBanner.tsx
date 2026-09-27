'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function OfflineBanner() {
  const { t } = useLocale()
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    // iOS / WKWebView sometimes miss the offline event on resume — poll lightly.
    const id = window.setInterval(update, 4000)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      window.clearInterval(id)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="alert"
      data-testid="offline-banner"
      className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-center text-sm py-2 px-4 safe-area-pt"
    >
      {t('improvements.offline')}
      <button
        type="button"
        className="underline ms-2 font-bold"
        onClick={() => {
          if (navigator.onLine) window.location.reload()
        }}
      >
        {t('improvements.retry')}
      </button>
    </div>
  )
}
