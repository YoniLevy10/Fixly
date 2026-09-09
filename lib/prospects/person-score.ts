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
]

const PERSON_HINTS = [
  /נייד/,
  /פרטי/,
  /עצמאי/,
  /עד\s*הבית/,
  /מומלץ/,
]

/** Rough Hebrew personal-name shape: 2–4 short words without company markers. */
function looksLikePersonName(raw: string): boolean {
  const name = raw.trim()
  if (!name) return false
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  // Prefer Hebrew letters in most words
  const hebrewWords = words.filter((w) => /[\u0590-\u05FF]{2,}/.test(w))
  if (hebrewWords.length < 2) return false
  // Avoid all-caps Latin brands
  if (/^[A-Z0-9\s.&-]{6,}$/.test(name)) return false
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

  if (looksLikePersonName(name)) {
    score += 35
    reasons.push('person_name_shape')
  } else if (looksLikePersonName(businessName ?? '')) {
    score += 25
    reasons.push('business_looks_like_person')
  } else {
    score -= 10
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
