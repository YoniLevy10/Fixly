const UTM_STORAGE_KEY = 'fixly-utm'

export type UtmParams = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

export function readUtmFromSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null }
): UtmParams {
  const next: UtmParams = {}
  for (const key of UTM_KEYS) {
    const value = searchParams.get(key)?.trim()
    if (value) next[key] = value.slice(0, 200)
  }
  return next
}

export function hasUtm(params: UtmParams): boolean {
  return UTM_KEYS.some((key) => Boolean(params[key]))
}

export function storeUtm(params: UtmParams) {
  if (typeof window === 'undefined' || !hasUtm(params)) return
  try {
    const existing = getStoredUtm()
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify({ ...existing, ...params }))
  } catch {
    // ignore quota / private mode
  }
}

const SEARCH_ENGINES: ReadonlyArray<{ needle: string; source: string }> = [
  { needle: 'google.', source: 'google' },
  { needle: 'bing.com', source: 'bing' },
  { needle: 'yahoo.', source: 'yahoo' },
  { needle: 'duckduckgo.com', source: 'duckduckgo' },
]

/**
 * First-touch source when the URL has no UTM.
 * Search referrers become organic. A same-site referrer is ignored so an
 * existing first touch is not replaced. Direct visits are recorded once.
 */
export function inferVisitAttribution(input: {
  referrer: string
  pathname: string
  existing: UtmParams
}): UtmParams | null {
  if (hasUtm(input.existing)) return null
  const campaign = (input.pathname || '/').split('?')[0]?.slice(0, 200) || '/'
  const referrer = input.referrer.trim()
  if (!referrer) {
    return { utm_source: 'direct', utm_medium: 'none', utm_campaign: campaign }
  }
  let host = ''
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return { utm_source: 'direct', utm_medium: 'none', utm_campaign: campaign }
  }
  if (host === 'fixly.tech' || host === 'www.fixly.tech' || host === 'localhost' || host === '127.0.0.1') {
    return null
  }
  const engine = SEARCH_ENGINES.find((item) => host.includes(item.needle))
  if (engine) {
    return { utm_source: engine.source, utm_medium: 'organic', utm_campaign: campaign }
  }
  return {
    utm_source: 'referral',
    utm_medium: host.slice(0, 80),
    utm_campaign: campaign,
  }
}

/** Fields safe to send to analytics. Campaign labels only — never a query or contact. */
export function publicAttribution(params: UtmParams): UtmParams {
  const next: UtmParams = {}
  if (params.utm_source) next.utm_source = params.utm_source
  if (params.utm_medium) next.utm_medium = params.utm_medium
  if (params.utm_campaign) next.utm_campaign = params.utm_campaign
  return next
}

export function getStoredUtm(): UtmParams {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as UtmParams
    const cleaned: UtmParams = {}
    for (const key of UTM_KEYS) {
      const value = parsed[key]
      if (typeof value === 'string' && value.trim()) {
        cleaned[key] = value.trim().slice(0, 200)
      }
    }
    return cleaned
  } catch {
    return {}
  }
}
