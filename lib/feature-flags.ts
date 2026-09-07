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
  analytics: process.env.NEXT_PUBLIC_FF_ANALYTICS === 'true',
  pushNotifications: isDemoDataMode() || process.env.NEXT_PUBLIC_FF_PUSH === 'true',
  monetization: process.env.NEXT_PUBLIC_FF_MONETIZATION !== 'false',
  googleOAuth: process.env.NEXT_PUBLIC_FF_GOOGLE_OAUTH !== 'false',
  liveTracking: process.env.NEXT_PUBLIC_FF_LIVE_TRACKING !== 'false',
  /**
   * Pre-launch mode: branded domain (fixly.tech) shows waitlist on `/`.
   * Product hosts (*.vercel.app, localhost) still serve the full app.
   * Set to false after public launch to show the app on every host.
   * Host resolution: `lib/site-hosts.ts` → `shouldShowPrelaunchLanding`.
   */
  prelaunch: process.env.NEXT_PUBLIC_FF_PRELAUNCH !== 'false',
} as const
