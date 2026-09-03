import { featureFlags } from '@/lib/feature-flags'

export type AnalyticsEvent =
  | 'request_created'
  | 'request_completed'
  | 'pro_accepted'
  | 'pro_join_submitted'
  | 'waitlist_submitted'
  | 'language_changed'
  | 'share_request'
  | 'job_checkout_started'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (!featureFlags.analytics) return
  if (typeof window !== 'undefined' && 'gtag' in window) {
    window.gtag?.('event', event, props)
  }
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, props)
  }
}
