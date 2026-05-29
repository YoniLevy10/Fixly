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
  pushNotifications:
    process.env.NEXT_PUBLIC_FF_DEMO_DATA === 'true' ||
    process.env.NEXT_PUBLIC_FF_PUSH === 'true',
  monetization: process.env.NEXT_PUBLIC_FF_MONETIZATION !== 'false',
  googleOAuth: process.env.NEXT_PUBLIC_FF_GOOGLE_OAUTH !== 'false',
  liveTracking: process.env.NEXT_PUBLIC_FF_LIVE_TRACKING !== 'false',
} as const
