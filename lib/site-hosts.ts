/**
 * Host routing for Fixly.
 *
 * - Marketing hosts (`fixly.tech` / `www`): registration / waitlist landing ONLY.
 * - Product hosts (Vercel production aliases, preview `*.vercel.app`, localhost):
 *   full marketplace / app UI.
 *
 * Consumer create-request is separately gated by `launch_regions` / nationwide
 * (see lib/regions/consumer-access.ts). Host marketing lock ≠ city open.
 */

export const MARKETING_HOSTS = ['fixly.tech', 'www.fixly.tech'] as const

/**
 * Production Vercel aliases that serve the full product UI.
 * (Historically redirected to fixly.tech — that bounce is intentionally removed.)
 */
export const LEGACY_VERCEL_PRODUCTION_HOSTS = [
  'fixly.vercel.app',
  'fixly-five.vercel.app',
  'www.fixly.vercel.app',
] as const

/** Paths allowed on marketing hosts (everything else → /waitlist). */
const MARKETING_PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/waitlist',
  '/pro/join',
  '/privacy',
  '/terms',
  '/about',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
  '/manifest',
])

export function normalizeHost(host: string | null | undefined): string {
  if (!host) return ''
  return host.split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') ?? ''
}

export function normalizePathname(pathname: string | null | undefined): string {
  const raw = (pathname || '/').split('?')[0] || '/'
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1)
  return raw || '/'
}

export function isMarketingHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  return (MARKETING_HOSTS as readonly string[]).includes(h)
}

/**
 * Public marketing hosts should stay indexable (fixly.tech).
 * Preview / localhost sandboxes stay noindex.
 */
export function isIndexablePublicHost(host: string | null | undefined): boolean {
  return isMarketingHost(host)
}

export function isLegacyVercelProductionHost(
  host: string | null | undefined,
): boolean {
  const h = normalizeHost(host)
  return (LEGACY_VERCEL_PRODUCTION_HOSTS as readonly string[]).includes(h)
}

/**
 * Hosts that may serve the full product / marketplace UI.
 * Marketing hosts are intentionally excluded — they are registration-only.
 */
export function isProductHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  if (!h) return false
  if (isMarketingHost(h)) return false
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return true
  if (isLegacyVercelProductionHost(h)) return true
  // Preview deployments (git branch aliases) still count as product for testing
  if (h.endsWith('.vercel.app')) return true
  const configured = normalizeHost(process.env.NEXT_PUBLIC_PRODUCT_HOST)
  return Boolean(configured && h === configured)
}

/**
 * Landing / waitlist on `/` for the purchased domain only.
 * Always true on marketing hosts (permanent registration-only lock),
 * regardless of `featureFlags.prelaunch` or demo mode.
 */
export function shouldShowPrelaunchLanding(host: string | null | undefined): boolean {
  return isMarketingHost(host)
}

/**
 * Allowlist for marketing hosts. Static assets / `_next` are excluded by the
 * middleware matcher; everything else on fixly.tech must match this list.
 */
export function isMarketingPublicPath(pathname: string | null | undefined): boolean {
  const p = normalizePathname(pathname)
  if (MARKETING_PUBLIC_EXACT_PATHS.has(p)) return true
  if (p === '/il-only' || p.startsWith('/il-only/')) return true
  if (p === '/api/waitlist' || p.startsWith('/api/waitlist/')) return true
  if (p === '/api/pro/waitlist' || p.startsWith('/api/pro/waitlist/')) return true
  return false
}

export function requestHostFromHeaders(headersList: Headers): string {
  return (
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    ''
  )
}
