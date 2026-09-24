'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { GEO_COOKIE_BLOCKED, GEO_COOKIE_NAME } from '@/lib/geo/israel-access'

function readGeoCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GEO_COOKIE_NAME}=`))
  return match ? decodeURIComponent(match.slice(GEO_COOKIE_NAME.length + 1)) : null
}

/**
 * Loads Meta (Facebook) Pixel when NEXT_PUBLIC_META_PIXEL_ID is set.
 * Skips geo-blocked (non-Israel) visitors.
 */
export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    setAllowed(readGeoCookie() !== GEO_COOKIE_BLOCKED)
  }, [])

  if (!pixelId || !allowed) return null

  return (
    <>
      <Script id="meta-pixel" strategy="lazyOnload">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
