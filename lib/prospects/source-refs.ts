/**
 * Website host normalization + source_ref helpers for cross-source merge.
 */

export type ProspectSourceRef = {
  source: string
  externalId?: string | null
  url?: string | null
  seenAt: string
}

export type ProspectLicense = {
  kind: string
  number?: string | null
  authority?: string | null
  validUntil?: string | null
  status?: string | null
  raw?: Record<string, unknown>
}

export function normalizeWebsiteHost(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null
  try {
    const raw = url.trim()
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const u = new URL(withProto)
    if (!u.hostname) return null
    return u.hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return null
  }
}

export function isMapsOrDirectoryUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true
  try {
    const host = normalizeWebsiteHost(url) ?? ''
    const blocked = [
      'google.com',
      'googleapis.com',
      'maps.app.goo.gl',
      'goo.gl',
      'facebook.com',
      'fb.com',
      'instagram.com',
      'twitter.com',
      'x.com',
      'linkedin.com',
      'youtube.com',
      'youtu.be',
      'tiktok.com',
      'wikipedia.org',
      'yelp.com',
      'tripadvisor.com',
      'b144.co.il',
      'd.co.il',
      'zap.co.il',
      'midrag.co.il',
      'rest.co.il',
      'easy.co.il',
      'goldenpages.co.il',
      'dnb.com',
      'dbisrael.co.il',
    ]
    return blocked.some((b) => host === b || host.endsWith(`.${b}`))
  } catch {
    return true
  }
}

/** Prefer business website over maps / aggregator URIs. */
export function pickWebsiteUrl(
  websiteUrl?: string | null,
  sourceUrl?: string | null,
): string | null {
  for (const cand of [websiteUrl, sourceUrl]) {
    if (!cand?.trim()) continue
    if (!/^https?:\/\//i.test(cand.trim())) continue
    if (isMapsOrDirectoryUrl(cand)) continue
    return cand.trim()
  }
  return null
}

export function mergeSourceRefs(
  existing: ProspectSourceRef[] | null | undefined,
  incoming: ProspectSourceRef,
): ProspectSourceRef[] {
  const list = Array.isArray(existing) ? [...existing] : []
  const key = `${incoming.source}::${incoming.externalId ?? ''}`
  const idx = list.findIndex(
    (r) => `${r.source}::${r.externalId ?? ''}` === key,
  )
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...incoming, seenAt: incoming.seenAt }
  } else {
    list.push(incoming)
  }
  return list.slice(0, 40)
}

export function preferLicense(
  current: ProspectLicense | null | undefined,
  incoming: ProspectLicense | null | undefined,
): ProspectLicense | null {
  if (!incoming) return current ?? null
  if (!current) return incoming
  // Prefer valid / non-expired incoming when current lacks status
  const incomingOk =
    !incoming.status ||
    /בתוקף|valid|active/i.test(incoming.status)
  const currentOk =
    !current.status || /בתוקף|valid|active/i.test(current.status)
  if (incomingOk && !currentOk) return incoming
  if (incoming.number && !current.number) return incoming
  if (incoming.validUntil && !current.validUntil) return incoming
  return current
}
