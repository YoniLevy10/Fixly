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
