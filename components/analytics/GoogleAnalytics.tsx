'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { GEO_COOKIE_BLOCKED, GEO_COOKIE_NAME } from '@/lib/geo/israel-access'
import { featureFlags } from '@/lib/feature-flags'

/** Production GA4 property — public client ID (safe to ship in the browser). */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-EK4R8FW52G'

function readGeoCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GEO_COOKIE_NAME}=`))
  return match ? decodeURIComponent(match.slice(GEO_COOKIE_NAME.length + 1)) : null
}

/**
 * Loads Google Analytics 4 when analytics flag is on.
 * Skips visitors blocked by the Israel-only geo gate so foreign traffic
 * does not pollute marketplace funnel metrics.
 */
export default function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    setAllowed(readGeoCookie() !== GEO_COOKIE_BLOCKED)
  }, [])

  if (!featureFlags.analytics || !GA_MEASUREMENT_ID || !allowed) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}
