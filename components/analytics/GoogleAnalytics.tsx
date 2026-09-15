'use client'

import Script from 'next/script'
import { featureFlags } from '@/lib/feature-flags'

/**
 * Loads Google Analytics 4 when analytics flag is on and measurement ID is set.
 * Events are sent via lib/analytics/track.ts → window.gtag.
 */
export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  if (!featureFlags.analytics || !measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}
