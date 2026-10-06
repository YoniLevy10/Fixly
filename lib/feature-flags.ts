import { isDemoDataMode } from '@/lib/data/demo-mode'

/**
 * Env-based feature flags — no deploy needed to toggle experiments.
 * Getters read process.env at access time so unit tests (and server
 * runtime) can flip flags without re-importing the module. Next.js still
 * inlines NEXT_PUBLIC_* for client bundles at build time.
 */
export const featureFlags = {
  get quickRequest() {
    return process.env.NEXT_PUBLIC_FF_QUICK_REQUEST !== 'false'
  },
  get priceEstimate() {
    return process.env.NEXT_PUBLIC_FF_PRICE_ESTIMATE !== 'false'
  },
  get requestDrafts() {
    return process.env.NEXT_PUBLIC_FF_REQUEST_DRAFTS !== 'false'
  },
  get pullToRefresh() {
    return process.env.NEXT_PUBLIC_FF_PULL_REFRESH !== 'false'
  },
  get shareRequest() {
    return process.env.NEXT_PUBLIC_FF_SHARE_REQUEST !== 'false'
  },
  get proTemplates() {
    return process.env.NEXT_PUBLIC_FF_PRO_TEMPLATES !== 'false'
  },
  get seasonalCategories() {
    return process.env.NEXT_PUBLIC_FF_SEASONAL !== 'false'
  },
  /** GA4 on by default (G-EK4R8FW52G). Set NEXT_PUBLIC_FF_ANALYTICS=false to disable. */
  get analytics() {
    return process.env.NEXT_PUBLIC_FF_ANALYTICS !== 'false'
  },
  get pushNotifications() {
    return isDemoDataMode() || process.env.NEXT_PUBLIC_FF_PUSH === 'true'
  },
  /**
   * Monetization / Grow checkout. Opt-in — off for nationwide launch (payments deferred).
   */
  get monetization() {
    return process.env.NEXT_PUBLIC_FF_MONETIZATION === 'true'
  },
  get googleOAuth() {
    return process.env.NEXT_PUBLIC_FF_GOOGLE_OAUTH !== 'false'
  },
  get liveTracking() {
    return process.env.NEXT_PUBLIC_FF_LIVE_TRACKING !== 'false'
  },
  /**
 * Pre-launch waitlist on marketing hosts. Default ON for recruitment /
 * waitlist-first mode. Set NEXT_PUBLIC_FF_PRELAUNCH=false to serve the full app
 * on fixly.tech again.
 */
  get prelaunch() {
    return process.env.NEXT_PUBLIC_FF_PRELAUNCH !== 'false'
  },
  /**
   * Open consumer create-request for every city in Israel.
   * See lib/regions/nationwide.ts
   */
  get nationwide() {
    return process.env.NEXT_PUBLIC_FF_NATIONWIDE === 'true'
  },
} as const
