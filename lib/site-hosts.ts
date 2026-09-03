/**
 * Host-based surface split during pre-launch:
 * - fixly.tech → marketing waitlist landing
 * - *.vercel.app / localhost → full product app
 */

export const MARKETING_HOSTS = ['fixly.tech', 'www.fixly.tech'] as const

export function normalizeHost(host: string | null | undefined): string {
  if (!host) return ''
  return host.split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') ?? ''
}

export function isMarketingHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  return (MARKETING_HOSTS as readonly string[]).includes(h)
}

/** Vercel preview/production aliases + local dev → product UI */
export function isProductHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  if (!h) return false
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return true
  if (h.endsWith('.vercel.app')) return true
  const configured = normalizeHost(process.env.NEXT_PUBLIC_PRODUCT_HOST)
  return Boolean(configured && h === configured)
}

/**
 * Show pre-launch waitlist on `/` for the branded domain only.
 * Product hosts (vercel.app / localhost) always get the marketplace home
 * so ops can demo the app while marketing collects leads on fixly.tech.
 *
 * Set NEXT_PUBLIC_FF_PRELAUNCH=false after full launch to show the app everywhere.
 */
export function shouldShowPrelaunchLanding(host: string | null | undefined): boolean {
  if (process.env.NEXT_PUBLIC_FF_PRELAUNCH === 'false') return false
  if (isProductHost(host)) return false
  if (isMarketingHost(host)) return true
  // Unknown hosts follow the env default (prelaunch on unless explicitly false)
  return process.env.NEXT_PUBLIC_FF_PRELAUNCH !== 'false'
}

export function requestHostFromHeaders(headersList: Headers): string {
  return (
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    ''
  )
}
