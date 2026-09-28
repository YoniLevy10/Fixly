import { isDemoDataMode } from '@/lib/data/demo-mode'

/** Env-based feature flags — no deploy needed to toggle experiments */
export const featureFlags = {
  quickRequest: process.env.NEXT_PUBLIC_FF_QUICK_REQUEST !== 'false',
  priceEstimate: process.env.NEXT_PUBLIC_FF_PRICE_ESTIMATE !== 'false',
  requestDrafts: process.env.NEXT_PUBLIC_FF_REQUEST_DRAFTS !== 'false',
  pullToRefresh: process.env.NEXT_PUBLIC_FF_PULL_REFRESH !== 'false',
  shareRequest: process.env.NEXT_PUBLIC_FF_SHARE_REQUEST !== 'false',
  proTemplates: process.env.NEXT_PUBLIC_FF_PRO_TEMPLATES !== 'false',
  seasonalCategories: process.env.NEXT_PUBLIC_FF_SEASONAL !== 'false',
  /** GA4 on by default (G-EK4R8FW52G). Set NEXT_PUBLIC_FF_ANALYTICS=false to disable. */
  analytics: process.env.NEXT_PUBLIC_FF_ANALYTICS !== 'false',
  pushNotifications: isDemoDataMode() || process.env.NEXT_PUBLIC_FF_PUSH === 'true',
  /**
   * Monetization / Grow checkout. Opt-in — off for nationwide launch (payments deferred).
   */
  monetization: process.env.NEXT_PUBLIC_FF_MONETIZATION === 'true',
  googleOAuth: process.env.NEXT_PUBLIC_FF_GOOGLE_OAUTH !== 'false',
  liveTracking: process.env.NEXT_PUBLIC_FF_LIVE_TRACKING !== 'false',
  /**
   * Pre-launch waitlist on marketing hosts. Opt-in only.
   * Nationwide production keeps this false so fixly.tech serves the app.
   */
  prelaunch: process.env.NEXT_PUBLIC_FF_PRELAUNCH === 'true',
  /**
   * Open consumer create-request for every city in Israel.
   * See lib/regions/nationwide.ts
   */
  nationwide: process.env.NEXT_PUBLIC_FF_NATIONWIDE === 'true',
} as const
