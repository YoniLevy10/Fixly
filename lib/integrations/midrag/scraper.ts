export type MidragReview = {
  source_review_id: string
  rating: number // 1-10
  text: string
  reviewer_name: string | null
  date: string | null // YYYY-MM-DD when parseable
}

export type MidragProfile = {
  name: string
  rating: number // 0-10
  reviews_count: number
  city: string | null
  category: string | null
  reviews: MidragReview[]
}

const MIDRAG_BASE = 'https://www.midrag.co.il'

/** Convert Midrag DD/MM/YYYY → ISO YYYY-MM-DD for Postgres date columns */
export function parseMidragDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const match = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  return `${yyyy}-${mm}-${dd}`
}

export function parseMidragUrl(url: string): { proId: string; fullUrl: string } | null {
  try {
    const u = new URL(url.trim())
    if (!u.hostname.includes('midrag.co.il')) return null
    const match = u.pathname.match(/\/SpCard\/Sp\/(\d+)/)
    if (!match) return null
    const proId = match[1]
    const areaId = u.searchParams.get('areaId')
    const serviceId = u.searchParams.get('serviceId')
    const params = new URLSearchParams()
    if (areaId) params.set('areaId', areaId)
    if (serviceId) params.set('serviceId', serviceId)
    const qs = params.toString()
    return {
      proId,
      fullUrl: `${MIDRAG_BASE}/SpCard/Sp/${proId}${qs ? `?${qs}` : ''}`,
    }
  } catch {
    return null
  }
}

export async function fetchMidragProfile(url: string): Promise<MidragProfile | null> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FixlyBot/1.0)',
      Accept: 'text/html',
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) return null
  const html = await res.text()

  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown'

  const ratingMatch = html.match(/ציון\s*כללי[\s\S]{0,200}?(\d{1,2}\.\d{1,2})/)
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0

  const countMatch = html.match(/חוות\s*דעת[\s\S]{0,200}?(\d{1,4})/)
  const reviewsCount = countMatch ? parseInt(countMatch[1], 10) : 0

  const cityMatch = html.match(
    />\s*(ירושלים|תל\s*אביב|חיפה|באר\s*שבע|רעננה|נתניה|אשדוד|פתח\s*תקווה|בני\s*ברק|חולון)\s*</,
  )
  const city = cityMatch ? cityMatch[1].trim() : null

  const catMatch = html.match(
    />([^<]+(?:מומלץ|אינסטלטור|חשמלאי|מזגן|ניקיון|צבעי|נגר|מנעולן|הדברה|מעלית))[^<]*</i,
  )
  const category = catMatch ? catMatch[1].trim() : null

  const parsed = parseMidragUrl(url)
  const proPrefix = parsed?.proId ?? 'unknown'

  const reviews: MidragReview[] = []
  const reviewRegex =
    /(\d{2}\/\d{2}\/\d{4})[\s\S]{0,500}?(\d{1,2})\s*\/\s*10[\s\S]{0,1000}?<[^>]*>([^<]{20,500})</g
  let match: RegExpExecArray | null
  let reviewIdx = 0
  while ((match = reviewRegex.exec(html)) && reviews.length < 50) {
    reviews.push({
      source_review_id: `midrag_${proPrefix}_${reviewIdx++}`,
      rating: parseInt(match[2], 10),
      text: match[3].trim(),
      reviewer_name: null,
      date: parseMidragDate(match[1]),
    })
  }

  return { name, rating, reviews_count: reviewsCount, city, category, reviews }
}

/** Convert Midrag 0–10 scale to Fixly 0–5 */
export function midragToFixlyRating(midragRating: number): number {
  return Math.round((midragRating / 2) * 10) / 10
}
