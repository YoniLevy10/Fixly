'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getStoredUtm,
  readUtmFromSearchParams,
  storeUtm,
  type UtmParams,
} from '@/lib/marketing/utm'

const REF_KEY = 'fixly-referral'

export default function ReferralCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem(REF_KEY, ref)

    const utm = readUtmFromSearchParams(searchParams)
    storeUtm(utm)
  }, [searchParams])

  return null
}

export function getStoredReferral(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REF_KEY)
}

export function getStoredAttribution(): UtmParams {
  return getStoredUtm()
}
