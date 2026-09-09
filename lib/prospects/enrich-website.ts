/**
 * Deterministic website enrichment with SSRF protections.
 * Does not invent licenses/availability; extracts keyword evidence only.
 */

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|0\.|\[::1\]|metadata\.google|metadata\.google\.internal)/i

const MAX_BYTES = 250_000
const FETCH_TIMEOUT_MS = 8_000

const SERVICE_KEYWORDS: Array<{ re: RegExp; service: string }> = [
  { re: /אינסטל|plumber|سباك/i, service: 'plumbing' },
  { re: /חשמל|electric|كهرب/i, service: 'electricity' },
  { re: /מזגן|air.?cond|تكييف/i, service: 'ac' },
  { re: /ניקיון|clean|تنظيف/i, service: 'cleaning' },
  { re: /צבע|paint|دهان/i, service: 'painting' },
  { re: /שיפוצ|renovat|ترميم/i, service: 'renovations' },
  { re: /רצף|tiling|بلاط/i, service: 'tiling' },
  { re: /מנעול|locksmith/i, service: 'locksmith' },
]

const RETAIL_KEYWORDS = /חנות|showroom|outlet|חומרי\s*בניין|wholesale|סיטונ/i
const PERFORMER_KEYWORDS =
  /עד\s*הבית|אצל\s*הלקוח|mobile\s*service|service\s*area|فني|טכנאי|מתקין/i

export type EnrichmentFact = {
  key: string
  value: string
  source: string
  fetchedAt: string
  confidence: number
}

export type WebsiteEnrichment = {
  facts: EnrichmentFact[]
  services: string[]
  businessKind: 'performer' | 'retail' | 'unknown'
  fetchedAt: string
  sourceUrl: string
}

function isBlockedUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return true
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true
  if (PRIVATE_HOST_RE.test(url.hostname)) return true
  if (url.hostname === '0.0.0.0') return true
  // Block literal IPs in private ranges
  const ip = url.hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ip) {
    const a = Number(ip[1])
    const b = Number(ip[2])
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
  }
  return false
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 40_000)
}

export async function enrichFromWebsite(
  websiteUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<WebsiteEnrichment | null> {
  if (!websiteUrl?.trim() || isBlockedUrl(websiteUrl)) return null

  const fetchedAt = new Date().toISOString()
  try {
    const res = await fetchImpl(websiteUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'FixlyProspectBot/1.0 (+https://fixly.tech)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const finalUrl = res.url || websiteUrl
    if (isBlockedUrl(finalUrl)) return null

    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) return null
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    const text = stripHtml(html)

    const services: string[] = []
    const facts: EnrichmentFact[] = []
    for (const { re, service } of SERVICE_KEYWORDS) {
      if (re.test(text)) {
        services.push(service)
        facts.push({
          key: 'service_keyword',
          value: service,
          source: finalUrl,
          fetchedAt,
          confidence: 55,
        })
      }
    }

    let businessKind: WebsiteEnrichment['businessKind'] = 'unknown'
    if (RETAIL_KEYWORDS.test(text) && !PERFORMER_KEYWORDS.test(text)) {
      businessKind = 'retail'
      facts.push({
        key: 'business_kind',
        value: 'retail',
        source: finalUrl,
        fetchedAt,
        confidence: 50,
      })
    } else if (PERFORMER_KEYWORDS.test(text)) {
      businessKind = 'performer'
      facts.push({
        key: 'business_kind',
        value: 'performer',
        source: finalUrl,
        fetchedAt,
        confidence: 55,
      })
    }

    if (facts.length === 0) return null

    return {
      facts,
      services: [...new Set(services)],
      businessKind,
      fetchedAt,
      sourceUrl: finalUrl,
    }
  } catch {
    return null
  }
}

/** Exported for unit tests */
export const __enrichTest = { isBlockedUrl, stripHtml }
