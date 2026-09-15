'use client'

import Script from 'next/script'
import { featureFlags } from '@/lib/feature-flags'

/** Production GA4 property — public client ID (safe to ship in the browser). */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-EK4R8FW52G'

/**
 * Loads Google Analytics 4 when analytics flag is on.
 * Events are sent via lib/analytics/track.ts → window.gtag.
 *
 * Snippet equivalent:
 *   gtag/js?id=G-EK4R8FW52G + gtag('config', 'G-EK4R8FW52G')
 */
export default function GoogleAnalytics() {
  if (!featureFlags.analytics || !GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
<<<<<<< HEAD
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
=======
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
>>>>>>> origin/main
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
