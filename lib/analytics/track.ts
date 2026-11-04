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
  | 'seo_landing_view'
  | 'seo_cta_click'
  | 'search_professional'
  | 'language_changed'
  | 'share_request'
  | 'job_checkout_started'
  | 'midrag_linked'
  | 'midrag_linked_demo'
  | 'midrag_unlinked'

/** Map product events → Meta standard events (Ads Manager optimization). */
const META_STANDARD_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  waitlist_page_view: 'ViewContent',
  seo_landing_view: 'ViewContent',
  waitlist_signup_started: 'InitiateCheckout',
  waitlist_signup_completed: 'CompleteRegistration',
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

const BLOCKED_ANALYTICS_KEYS = new Set([
  'id',
  'email',
  'phone',
  'fullName',
  'full_name',
  'name',
  'city',
  'referralCode',
  'referral_code',
])

/** Drop contact fields and any value that looks like a phone or email. */
export function sanitizeAnalyticsProps(
  props?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined
  const next: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(props)) {
    if (BLOCKED_ANALYTICS_KEYS.has(key)) continue
    if (typeof value === 'string' && /@|\d[\d\s()-]{6,}\d/.test(value)) continue
    next[key] = value
  }
  return next
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  const safeProps = sanitizeAnalyticsProps(props)

  // Never emit from localhost / Vercel preview even if a Script somehow loaded.
  if (!isAnalyticsHostAllowed()) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics:host-blocked]', event, safeProps)
    }
    return
  }

  if (featureFlags.analytics && 'gtag' in window) {
    window.gtag?.('event', event, safeProps)
  }

  if (typeof window.fbq === 'function') {
    const metaEvent = META_STANDARD_EVENTS[event]
    if (metaEvent) {
      window.fbq('track', metaEvent, safeProps ?? {})
    } else if (event.startsWith('waitlist_')) {
      window.fbq('trackCustom', event, safeProps ?? {})
    }
  }

  if (process.env.NODE_ENV === 'development') {
    if (!featureFlags.analytics && !process.env.NEXT_PUBLIC_META_PIXEL_ID) {
      console.debug('[analytics:off]', event, safeProps)
    } else {
      console.debug('[analytics]', event, safeProps)
    }
  }
}
