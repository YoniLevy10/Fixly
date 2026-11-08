/**
 * Israel-only market gate for Fixly (consumer + pro product UI).
 *
 * Uses Vercel geo (`x-vercel-ip-country` / request.geo). Search crawlers and
 * critical webhooks/crons stay allowed so SEO and ops keep working.
 */

export const ISRAEL_COUNTRY_CODE = 'IL'
export const GEO_COOKIE_NAME = 'fixly_geo'
export const GEO_COOKIE_IL = 'il'
export const GEO_COOKIE_BLOCKED = 'blocked'

const CRAWLER_UA =
  /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|applebot|semrushbot|ahrefsbot|mj12bot|dotsbot|petalbot|adsbot-google|googleother|google-inspectiontool|mediapartners-google|whatsapp|telegrambot|tiktok|pinterest|taboola|outbrain/i

/**
 * Default ON for Vercel production. Explicit env always wins.
 * Local / preview stay open unless `NEXT_PUBLIC_FF_ISRAEL_ONLY=true`.
 */
export function isIsraelOnlyGateEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_FF_ISRAEL_ONLY?.trim().toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'off') return false
  if (raw === 'true' || raw === '1' || raw === 'on') return true
  return process.env.VERCEL_ENV === 'production'
}

export function resolveRequestCountry(
  headers: Headers,
  geoCountry?: string | null,
): string | null {
  const fromHeader = headers.get('x-vercel-ip-country')?.trim().toUpperCase()
  if (fromHeader) return fromHeader
  const fromGeo = geoCountry?.trim().toUpperCase()
  return fromGeo || null
}

export function isSearchCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  return CRAWLER_UA.test(userAgent)
}

export function isLocalDevHost(host: string | null | undefined): boolean {
  if (!host) return false
  const h = host.split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') ?? ''
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0'
}

function normalizePath(pathname: string): string {
  return pathname.split('?')[0]?.toLowerCase() || '/'
}

/** Paths that must never be geo-blocked (ops, payments, SEO files, waitlist API). */
export function isGeoBypassPath(pathname: string): boolean {
  const p = normalizePath(pathname)
  if (p === '/il-only' || p.startsWith('/il-only/')) return true
  if (p === '/robots.txt' || p === '/sitemap.xml') return true
  if (p === '/manifest.webmanifest' || p === '/manifest.json') return true
  if (p === '/api/health' || p.startsWith('/api/health/')) return true
  if (p === '/api/keepalive') return true
  if (p.startsWith('/api/cron')) return true
  if (p.startsWith('/api/tranzila')) return true
  if (p.startsWith('/api/v1/')) return true
  if (p.startsWith('/api/billing/webhook')) return true
  if (p === '/api/waitlist' || p.startsWith('/api/waitlist/')) return true
  if (p === '/api/pro/waitlist' || p.startsWith('/api/pro/waitlist/')) return true
  if (p.startsWith('/auth/callback')) return true
  return false
}

/** Marketing / registration surfaces reachable outside Israel. */
export function isGeoPublicPath(pathname: string): boolean {
  const p = normalizePath(pathname)
  if (p === '/') return true
  if (p === '/waitlist' || p.startsWith('/waitlist/')) return true
  if (p === '/pro/join' || p.startsWith('/pro/join/')) return true
  if (p === '/for-professionals' || p.startsWith('/for-professionals/')) return true
  if (p === '/professionals' || p.startsWith('/professionals/')) return true
  if (p === '/locations' || p.startsWith('/locations/')) return true
  if (p === '/about' || p.startsWith('/about/')) return true
  if (p === '/privacy' || p.startsWith('/privacy/')) return true
  if (p === '/terms' || p.startsWith('/terms/')) return true
  if (p === '/il-only' || p.startsWith('/il-only/')) return true
  if (p === '/services' || p.startsWith('/services')) return true
  return false
}

export type GeoDecision = 'allow' | 'block'

export function decideIsraelAccess(input: {
  enabled: boolean
  country: string | null
  userAgent: string | null | undefined
  pathname: string
  host?: string | null
  geoCookie?: string | null
}): GeoDecision {
  if (!input.enabled) return 'allow'
  if (isGeoPublicPath(input.pathname)) return 'allow'
  if (isLocalDevHost(input.host)) return 'allow'
  if (isGeoBypassPath(input.pathname)) return 'allow'
  if (input.geoCookie === GEO_COOKIE_IL) return 'allow'
  if (isSearchCrawler(input.userAgent)) return 'allow'
  // Missing geo (some edge / offline) — fail open to avoid locking Israelis
  if (!input.country) return 'allow'
  if (input.country === ISRAEL_COUNTRY_CODE) return 'allow'
  return 'block'
}
