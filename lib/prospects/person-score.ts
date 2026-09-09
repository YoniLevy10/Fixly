/**
 * Heuristics to prefer independent / individual tradespeople over companies.
 * Used after legal discovery (Places/OSM) before saving prospects.
 */

const COMPANY_MARKERS = [
  /בע"?מ/i,
  /ע\.?מ/i,
  /\bltd\b/i,
  /\blimited\b/i,
  /\binc\b/i,
  /\bllc\b/i,
  /חברת\s/i,
  /החברה\s/i,
  /רשת\s/i,
  /סופר\s/i,
  /קניון/i,
  /מרכז\s+שירות/i,
  /מוקד/i,
  /קול\s*סנטר/i,
  /call\s*center/i,
  /הובלות\s+ארצי/i,
  /בינלאומ/i,
  /גרופ/i,
  /\bgroup\b/i,
  /אחזקות/i,
  /השקעות/i,
  /ניהול\s+נכס/i,
  /שירותי\s/i,
  /מערכות\s/i,
  /פתרונות\s/i,
  /התקנות\s/i,
  /\bservices?\b/i,
  /חנות\s/i,
  /סוכנות/i,
  /מפעל/i,
  /תעשי/i,
  /אאוטלט/i,
  /\boutlet\b/i,
  /חומרי\s+בניין/i,
  /משתלה/i,
  /design\s*center/i,
  /סניף/i,
]

const PERSON_HINTS = [
  /נייד/,
  /פרטי/,
  /עצמאי/,
  /עד\s*הבית/,
  /מומלץ/,
]

/** Retail / showroom signals from Places (esp. ceramics & flooring). */
const RETAIL_MARKERS = [
  /חנות/,
  /אאוטלט/i,
  /\boutlet\b/i,
  /ceramica/i,
  /ceramic/i,
  /קרמיקה/,
  /פרקט/,
  /שיש\s/,
  /משתל/,
  /חומרי\s*בניין/,
  /design\s*center/i,
  /סניף/,
]

const INSTALLER_HINTS =
  /מתקין|רצף|התקנ|טכנאי|צבעי|גנן|מנעולן|אינסטלטור|חשמלאי|זגג|מדביר|נגר|קבלן|הנדימן|handyman/i

/** Words that are trade / place / commercial — not a person's given name. */
const NON_PERSONAL_WORDS = new Set(
  [
    'פרקט',
    'פרקטים',
    'קרמיקה',
    'קרמיק',
    'שיש',
    'אריחים',
    'אריח',
    'חיפוי',
    'outlet',
    'אאוטלט',
    'חנות',
    'משתלה',
    'משתלת',
    'דירה',
    'דירות',
    'בירושלים',
    'ירושלים',
    'חומרי',
    'בניין',
    'סניף',
    'ליין',
    'אינסטלטור',
    'אינסטלציה',
    'אינסטלטורים',
    'חשמלאי',
    'חשמל',
    'חשמלאים',
    'צבעי',
    'צבעים',
    'נגר',
    'נגרות',
    'מנעולן',
    'מנעולים',
    'גנן',
    'גינון',
    'הובלה',
    'הובלות',
    'רצף',
    'ריצוף',
    'ניקיון',
    'מנקה',
    'מזגן',
    'מזגנים',
    'מיזוג',
    'טכנאי',
    'טכנאים',
    'שירות',
    'שירותים',
    'מוסמך',
    'מוסמכים',
    'דירות',
    'בתים',
    'בית',
    'פרטי',
    'פרטית',
    'נייד',
    'ירושלים',
    'תל',
    'אביב',
    'חיפה',
    'באר',
    'שבע',
    'ראשון',
    'לציון',
    'פתח',
    'תקווה',
    'מודיעין',
    'ביתר',
    'עילית',
    'מעלה',
    'אדומים',
    'אזור',
    'מרכז',
    'צפון',
    'דרום',
    'מערב',
    'מזרח',
    'כללי',
    'מהיר',
    'זול',
    'מקצועי',
    'מקצועית',
    'התקנה',
    'תיקון',
    'תיקונים',
    'עבודות',
    'קבלן',
    'קבלנים',
    'חברה',
    'בעמ',
    "בע\"מ",
    'ltd',
    'group',
  ].map((w) => w.toLowerCase()),
)

function normalizeWord(w: string): string {
  return w.replace(/["""''׳״.,]/g, '').trim().toLowerCase()
}

function isLikelyPersonalWord(word: string): boolean {
  const w = normalizeWord(word)
  if (w.length < 2) return false
  if (NON_PERSONAL_WORDS.has(w)) return false
  // Pure digits / Latin brand tokens
  if (/^[0-9]+$/.test(w)) return false
  if (/^[a-z0-9.&-]{3,}$/i.test(w) && !/[\u0590-\u05FF]/.test(w)) return false
  return /[\u0590-\u05FF]{2,}/.test(w)
}

/**
 * Person-shaped: 2–4 words with at least one personal-looking token
 * (e.g. "דני אינסטלטור", "יוסי כהן") — not pure trade+city ("אינסטלציה ירושלים").
 */
function looksLikePersonName(raw: string): boolean {
  const name = raw.trim()
  if (!name) return false
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  if (/^[A-Z0-9\s.&-]{6,}$/.test(name)) return false

  const personal = words.filter(isLikelyPersonalWord)
  if (personal.length < 1) return false

  // Need enough Hebrew content overall
  const hebrewWords = words.filter((w) => /[\u0590-\u05FF]{2,}/.test(w))
  if (hebrewWords.length < 2) return false

  // If every word is non-personal trade/geo, reject
  if (words.every((w) => NON_PERSONAL_WORDS.has(normalizeWord(w)))) return false

  return true
}

export type PersonFit = {
  score: number
  kind: 'person' | 'likely_person' | 'ambiguous' | 'company'
  reasons: string[]
}

export function scorePersonFit(name: string, businessName?: string | null): PersonFit {
  const label = `${name} ${businessName ?? ''}`.trim()
  const reasons: string[] = []
  let score = 50

  for (const re of COMPANY_MARKERS) {
    if (re.test(label)) {
      score -= 45
      reasons.push('company_marker')
      break
    }
  }

  // Ceramic / parquet showrooms dominate Places "tiling" results
  if (RETAIL_MARKERS.some((re) => re.test(label)) && !INSTALLER_HINTS.test(label)) {
    score -= 40
    reasons.push('retail_showroom')
  }

  if (looksLikePersonName(name)) {
    score += 35
    reasons.push('person_name_shape')
  } else if (looksLikePersonName(businessName ?? '')) {
    score += 25
    reasons.push('business_looks_like_person')
  } else {
    score -= 15
    reasons.push('not_person_shaped')
  }

  for (const re of PERSON_HINTS) {
    if (re.test(label)) {
      score += 10
      reasons.push('person_hint')
      break
    }
  }

  // Long commercial slogans
  if (label.length > 40) {
    score -= 15
    reasons.push('long_commercial_name')
  }

  score = Math.max(0, Math.min(100, score))

  let kind: PersonFit['kind'] = 'ambiguous'
  if (score >= 70) kind = 'person'
  else if (score >= 55) kind = 'likely_person'
  else if (score <= 35) kind = 'company'

  return { score, kind, reasons }
}

/**
 * Keep only individuals / likely individuals.
 * Ambiguous commercial listings (typical Places results) are dropped —
 * Fixly recruits solo tradespeople, not companies.
 */
export function shouldKeepAsSoloProspect(
  name: string,
  businessName?: string | null,
): boolean {
  const fit = scorePersonFit(name, businessName)
  return fit.score >= 55
}
