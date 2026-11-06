'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getStoredUtm,
  hasUtm,
  inferVisitAttribution,
  readUtmFromSearchParams,
  storeUtm,
  type UtmParams,
} from '@/lib/marketing/utm'

const REF_KEY = 'fixly-referral'

export default function ReferralCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    try {
      const ref = searchParams.get('ref')
      if (ref) localStorage.setItem(REF_KEY, ref)

      const utm = readUtmFromSearchParams(searchParams)
      if (hasUtm(utm)) {
        storeUtm(utm)
        return
      }
      const inferred = inferVisitAttribution({
        referrer: document.referrer,
        pathname: window.location.pathname,
        existing: getStoredUtm(),
      })
      if (inferred) storeUtm(inferred)
    } catch {
      // Private mode and blocked storage must not stop the page.
    }
  }, [searchParams])

  return null
}

export function getStoredReferral(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(REF_KEY)
  } catch {
    return null
  }
}

export function getStoredAttribution(): UtmParams {
  return getStoredUtm()
}
