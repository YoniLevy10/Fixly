import { featureFlags } from '@/lib/feature-flags'

export type AnalyticsEvent =
  | 'request_created'
  | 'request_completed'
  | 'pro_accepted'
  | 'pro_join_submitted'
  | 'language_changed'
  | 'share_request'

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (!featureFlags.analytics) return
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).gtag?.('event', event, props)
  }
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, props)
  }
}
