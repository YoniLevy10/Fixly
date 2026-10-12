'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/track'

type Props = {
  pageType: 'category_city' | 'category_hub' | 'location_hub' | 'locations_index' | 'for_professionals' | 'pro_profile'
  category?: string
  city?: string
  indexable?: boolean
}

export default function SeoLandingTracker({
  pageType,
  category,
  city,
  indexable,
}: Props) {
  useEffect(() => {
    track('seo_landing_view', {
      page_type: pageType,
      ...(category ? { category } : {}),
      ...(city ? { city } : {}),
      ...(indexable != null ? { indexable } : {}),
      landing_page:
        typeof window !== 'undefined' ? window.location.pathname : pageType,
    })

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-seo-cta]')
      if (!el) return
      const cta = el.getAttribute('data-seo-cta') || 'unknown'
      track('seo_cta_click', {
        cta,
        page_type: pageType,
        ...(category ? { category } : {}),
        ...(city ? { city } : {}),
      })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [pageType, category, city, indexable])

  return null
}
