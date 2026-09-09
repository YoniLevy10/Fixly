/**
 * Host routing for Fixly.
 * Canonical public domain is always fixly.tech — not *.vercel.app aliases.
 *
 * Consumer create-request is separately gated by `launch_regions` density
 * (see lib/regions/consumer-access.ts). Host prelaunch ≠ city open.
 */

import { isDemoDataMode } from '@/lib/data/demo-mode'

export const MARKETING_HOSTS = ['fixly.tech', 'www.fixly.tech'] as const

/** Production Vercel aliases that should redirect to fixly.tech */
export const LEGACY_VERCEL_PRODUCTION_HOSTS = [
  'fixly.vercel.app',
  'fixly-five.vercel.app',
  'www.fixly.vercel.app',
] as const

export function normalizeHost(host: string | null | undefined): string {
  if (!host) return ''
  return host.split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') ?? ''
}

export function isMarketingHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  return (MARKETING_HOSTS as readonly string[]).includes(h)
}

export function isLegacyVercelProductionHost(
  host: string | null | undefined,
): boolean {
  const h = normalizeHost(host)
  return (LEGACY_VERCEL_PRODUCTION_HOSTS as readonly string[]).includes(h)
}

/** Local + branded domain + configured host → product UI */
export function isProductHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  if (!h) return false
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return true
  if (isMarketingHost(h)) return true
  if (isLegacyVercelProductionHost(h)) return true
  // Preview deployments (git branch aliases) still count as product for testing
  if (h.endsWith('.vercel.app')) return true
  const configured = normalizeHost(process.env.NEXT_PUBLIC_PRODUCT_HOST)
  return Boolean(configured && h === configured)
}

/**
 * Show pre-launch waitlist on `/` only when explicitly enabled and not in demo.
 * Canonical product lives on fixly.tech.
 *
 * Set NEXT_PUBLIC_FF_PRELAUNCH=false (or leave demo on) to show the app on fixly.tech.
 * Set NEXT_PUBLIC_FF_DEMO_KILL=true + PRELAUNCH=true to restore waitlist-only marketing hosts.
 */
export function shouldShowPrelaunchLanding(host: string | null | undefined): boolean {
  if (isDemoDataMode()) return false
  if (process.env.NEXT_PUBLIC_FF_PRELAUNCH === 'false') return false
  if (isProductHost(host) && !isMarketingHost(host)) return false
  if (isMarketingHost(host)) {
    // Branded domain shows waitlist only when prelaunch is on AND demo kill is set
    return process.env.NEXT_PUBLIC_FF_DEMO_KILL === 'true'
  }
  return process.env.NEXT_PUBLIC_FF_PRELAUNCH !== 'false'
}

export function requestHostFromHeaders(headersList: Headers): string {
  return (
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    ''
  )
}
