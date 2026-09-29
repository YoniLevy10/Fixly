import { featureFlags } from '@/lib/feature-flags'
import { isAnalyticsHostAllowed } from '@/lib/analytics/allowed-host'

export type AnalyticsEvent =
  | 'request_created'
  | 'request_completed'
  | 'pro_accepted'
  | 'pro_join_submitted'
  | 'waitlist_submitted'
  | 'waitlist_page_view'
  | 'waitlist_cta_click'
  | 'waitlist_signup_started'
  | 'waitlist_signup_completed'
  | 'waitlist_form_error'
  | 'waitlist_scroll_depth'
  | 'waitlist_audience_switch'
  | 'waitlist_share_click'
  | 'language_changed'
  | 'share_request'
  | 'job_checkout_started'
  | 'midrag_linked'
  | 'midrag_linked_demo'
  | 'midrag_unlinked'

/** Map product events → Meta standard events (Ads Manager optimization). */
const META_STANDARD_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  waitlist_page_view: 'ViewContent',
  waitlist_signup_started: 'InitiateCheckout',
  waitlist_signup_completed: 'CompleteRegistration',
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return

  // Never emit from localhost / Vercel preview even if a Script somehow loaded.
  if (!isAnalyticsHostAllowed()) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics:host-blocked]', event, props)
    }
    return
  }

  if (featureFlags.analytics && 'gtag' in window) {
    window.gtag?.('event', event, props)
  }

  if (typeof window.fbq === 'function') {
    const metaEvent = META_STANDARD_EVENTS[event]
    if (metaEvent) {
      window.fbq('track', metaEvent, props ?? {})
    } else if (event.startsWith('waitlist_')) {
      window.fbq('trackCustom', event, props ?? {})
    }
  }

  if (process.env.NODE_ENV === 'development') {
    if (!featureFlags.analytics && !process.env.NEXT_PUBLIC_META_PIXEL_ID) {
      console.debug('[analytics:off]', event, props)
    } else {
      console.debug('[analytics]', event, props)
    }
  }
}
