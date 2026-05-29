/**
 * Single source of truth for native / App Store identifiers.
 * Keep in sync with capacitor.config.ts and ios/App bundle settings.
 */
export const APP_STORE_CONFIG = {
  appId: 'com.fixly.app',
  appName: 'Fixly',
  bundleDisplayName: 'Fixly',
  /** Marketing version — align with package.json */
  version: '0.1.0',
  buildNumber: '1',
  supportEmail: 'support@fixly.app',
  /** Public privacy URL for App Store Connect (must be HTTPS in production) */
  privacyPolicyPath: '/privacy',
  termsPath: '/terms',
  /** Domains the WebView may navigate to (auth, API, CDN) */
  allowedNavigationHosts: [
    'fixly.vercel.app',
    'vercel.app',
    'supabase.co',
    'lfzxvmievofvdhxrwggo.supabase.co',
  ],
} as const

export function privacyPolicyUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}${APP_STORE_CONFIG.privacyPolicyPath}`
}

export function termsUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}${APP_STORE_CONFIG.termsPath}`
}
