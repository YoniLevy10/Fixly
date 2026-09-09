/**
 * Prospect fit scoring — service relevance, business type, evidence quality.
 * Contactability (mobile vs landline) is computed separately and does NOT
 * decide professional suitability.
 */

import { FIT_WEIGHTS } from '@/lib/prospects/config'
import {
  classifyPhoneKind,
  type PhoneKind,
} from '@/lib/prospects/phone'

export type FitClass = 'suitable' | 'needs_review' | 'unsuitable' | 'unknown'

export type Contactability = 'mobile' | 'landline' | 'unknown' | 'none'

export type FitAssessment = {
  score: number
  confidence: number
  fitClass: FitClass
  reasons: string[]
  contactability: Contactability
  phoneKind: PhoneKind
}

/** Strong company / chain / call-center signals — auto unsuitable when dominant. */
const HARD_COMPANY_MARKERS = [
  /בע\s*["'״׳]?\s*מ/i,
  /ע\.\s*מ/i,
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
  /סניף/i,
  /מפעל/i,
  /תעשי/i,
  /סוכנות/i,
]

/** Soft commercial words — common in solo trade names; do NOT auto-reject. */
const SOFT_COMMERCIAL_WORDS = [
  /שירותי\s/i,
  /התקנות/i,
  /מערכות\s/i,
  /פתרונות\s/i,
  /\bservices?\b/i,
]

/** Retail / materials supplier — not an on-site performer. */
const RETAIL_MARKERS = [
  /חנות/,
  /אאוטלט/i,
  /\boutlet\b/i,
  /ceramica/i,
  /ceramic/i,
  /קרמיקה\s*(?:ו|ו-|\/)?\s*שיש/i,
  /משתל/,
  /חומרי\s*בניין/,
  /design\s*center/i,
  /ספק\s*חומר/i,
  /סיטונ/i,
  /\bwholesale\b/i,
  /\bshowroom\b/i,
]

const INSTALLER_HINTS =
  /מתקין|רצף|התקנ|טכנאי|צבעי|גנן|מנעולן|אינסטלטור|שרברב|חשמלאי|זגג|מדביר|נגר|קבלן|שיפוצ|הנדימן|plumber|electrician|locksmith|painter|gardener|cleaner|handyman|فني|سباك|كهربائي/i

const SERVICE_AT_HOME_HINTS =
  /עד\s*הבית|אצל\s*הלקוח|נייד|mobile|at\s*home|house\s*call|خدمة\s*منزلية|الى\s*المنزل|סאב|sab|service\s*area/i

/** Words that are trade / place — not a person's given name token. */
const NON_PERSONAL_WORDS = new Set(
  [
    'פרקט',
    'פרקטים',
    'קרמיקה',
    'קרמיק',
    'שיש',
    'אריחים',
    'אריח',
    'outlet',
    'אאוטלט',
    'חנות',
    'משתלה',
    'דירה',
    'דירות',
    'בירושלים',
    'ירושלים',
    'jerusalem',
    'חומרי',
    'בניין',
    'סניף',
    'אינסטלטור',
    'אינסטלציה',
    'שרברב',
    'חשמלאי',
    'חשמל',
    'צבעי',
    'צבע',
    'נגר',
    'מנעולן',
    'גנן',
    'מדביר',
    'זגג',
    'טכנאי',
    'מתקין',
    'קבלן',
    'שיפוצים',
    'שיפוצניק',
    'הובלות',
    'מוביל',
    'ניקיון',
    'מנקה',
    'רצף',
    'גבס',
    'אלומיניום',
    'plumbing',
    'electrician',
    'services',
    'service',
    'ltd',
    'llc',
    'group',
    'سباكة',
    'كهرباء',
    'تصليح',
  ].map((w) => w.toLowerCase()),
)

const HEBREW_NAME = /^[\u0590-\u05FF]{2,}$/
const ARABIC_NAME = /^[\u0600-\u06FF]{2,}$/
const LATIN_NAME = /^[A-Za-z][A-Za-z'.-]{1,}$/

function uniqLabel(name: string, businessName?: string | null): string {
  const n = name.trim()
  const b = (businessName ?? '').trim()
  if (!b || b.toLowerCase() === n.toLowerCase()) return n
  return `${n} ${b}`.trim()
}

function tokenize(label: string): string[] {
  return label
    .split(/[\s,|/\\+_.:־–—-]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function isPersonToken(token: string): boolean {
  const t = token.toLowerCase()
  if (NON_PERSONAL_WORDS.has(t)) return false
  if (HEBREW_NAME.test(token)) return true
  if (ARABIC_NAME.test(token)) return true
  if (LATIN_NAME.test(token) && token.length >= 2) return true
  return false
}

export function looksLikePersonName(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false
  const tokens = tokenize(raw)
  const personTokens = tokens.filter(isPersonToken)
  if (personTokens.length === 0) return false
  // At least one personal token and not dominated by retail-only phrase
  return personTokens.length >= 1 && personTokens.length >= Math.ceil(tokens.length / 3)
}

function hasAny(res: RegExp[], label: string): boolean {
  return res.some((re) => re.test(label))
}

export type FitScoreInput = {
  name: string
  businessName?: string | null
  phone?: string | null
  websiteUrl?: string | null
  address?: string | null
  /** Google Places types */
  placeTypes?: string[] | null
  pureServiceAreaBusiness?: boolean | null
  /** Soft area evidence (query neighborhood) — not verified service area */
  searchAreaHint?: string | null
}

/**
 * Score professional fitness for Fixly recruitment.
 * Missing evidence lowers confidence / may yield needs_review — never invents "unsuitable".
 */
export function assessProspectFit(input: FitScoreInput): FitAssessment {
  const reasons: string[] = []
  const label = uniqLabel(input.name, input.businessName)
  const phoneKind = classifyPhoneKind(input.phone)
  const contactability: Contactability = phoneKind

  let score = 40
  let confidence = 35

  const hardCompany = hasAny(HARD_COMPANY_MARKERS, label)
  const retail =
    hasAny(RETAIL_MARKERS, label) &&
    !INSTALLER_HINTS.test(label)
  const types = (input.placeTypes ?? []).map((t) => t.toLowerCase())
  const retailType = types.some((t) =>
    /store|shop|shopping|hardware|home_goods|furniture_store|electronics_store|supermarket/.test(
      t,
    ),
  )
  const serviceType = types.some((t) =>
    /plumber|electrician|locksmith|painter|roofing|general_contractor|moving_company|laundry|car_repair|home_services/.test(
      t,
    ),
  )

  if ((hardCompany || retail || retailType) && !INSTALLER_HINTS.test(label) && !serviceType && !input.pureServiceAreaBusiness) {
    reasons.push(
      hardCompany
        ? 'company_or_chain_marker'
        : retail || retailType
          ? 'retail_or_materials_supplier'
          : 'unsuitable_business_type',
    )
    return {
      score: Math.max(0, score + FIT_WEIGHTS.businessTypeRetailPenalty),
      confidence: 75,
      fitClass: 'unsuitable',
      reasons,
      contactability,
      phoneKind,
    }
  }

  if (hardCompany) {
    score += FIT_WEIGHTS.businessTypeCompanyPenalty
    confidence += 15
    reasons.push('company_marker_soft')
  }

  if (SOFT_COMMERCIAL_WORDS.some((re) => re.test(label))) {
    reasons.push('soft_commercial_word_ignored')
  }

  if (INSTALLER_HINTS.test(label) || serviceType || input.pureServiceAreaBusiness) {
    score += FIT_WEIGHTS.serviceAtCustomer
    confidence += 15
    reasons.push(
      input.pureServiceAreaBusiness
        ? 'pure_service_area_business'
        : 'on_site_service_signal',
    )
  } else {
    reasons.push('service_signal_unknown')
    confidence -= 5
  }

  if (SERVICE_AT_HOME_HINTS.test(label) || input.pureServiceAreaBusiness) {
    score += Math.round(FIT_WEIGHTS.serviceAtCustomer * 0.35)
    reasons.push('at_customer_hint')
  }

  if (!hardCompany && !retail && !retailType) {
    score += FIT_WEIGHTS.businessTypePerformer
    reasons.push('likely_service_performer')
  }

  if (looksLikePersonName(input.name) || looksLikePersonName(input.businessName)) {
    score += FIT_WEIGHTS.personNameBonus
    confidence += 10
    reasons.push('person_shaped_name')
  } else {
    reasons.push('no_clear_person_name')
    // Commercial trade name without person ≠ automatic reject
    confidence -= 5
  }

  if (phoneKind === 'mobile' || phoneKind === 'landline' || phoneKind === 'unknown') {
    if (input.phone?.trim()) {
      score += FIT_WEIGHTS.evidencePhone
      confidence += 8
      reasons.push(`phone_${phoneKind}`)
    }
  } else {
    reasons.push('phone_missing')
    confidence -= 8
  }

  if (input.websiteUrl?.trim()) {
    score += FIT_WEIGHTS.evidenceWebsite
    confidence += 5
    reasons.push('has_website')
  }

  if (input.address?.trim()) {
    score += FIT_WEIGHTS.evidenceAddress
    confidence += 4
    reasons.push('has_address')
  }

  if (input.pureServiceAreaBusiness) {
    score += FIT_WEIGHTS.evidenceSab
    confidence += 10
  }

  if (input.searchAreaHint?.trim()) {
    score += FIT_WEIGHTS.areaHint
    reasons.push('search_area_hint_unverified')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  confidence = Math.max(0, Math.min(100, Math.round(confidence)))

  let fitClass: FitClass
  if (score >= 62 && confidence >= 45) {
    fitClass = 'suitable'
  } else if (score <= 28 && confidence >= 55) {
    fitClass = 'unsuitable'
  } else if (
    !input.phone?.trim() &&
    !input.websiteUrl?.trim() &&
    !looksLikePersonName(input.name) &&
    !INSTALLER_HINTS.test(label)
  ) {
    fitClass = 'unknown'
    reasons.push('insufficient_evidence')
  } else {
    fitClass = 'needs_review'
  }

  return {
    score,
    confidence,
    fitClass,
    reasons,
    contactability,
    phoneKind,
  }
}

/** @deprecated Prefer assessProspectFit — kept for admin "reject companies" heuristics. */
export type PersonFit = {
  score: number
  kind: 'person' | 'likely_person' | 'ambiguous' | 'company'
  reasons: string[]
}

export function scorePersonFit(
  name: string,
  businessName?: string | null,
): PersonFit {
  const a = assessProspectFit({ name, businessName })
  let kind: PersonFit['kind'] = 'ambiguous'
  if (a.fitClass === 'unsuitable') kind = 'company'
  else if (a.score >= 70 && a.reasons.includes('person_shaped_name')) kind = 'person'
  else if (a.score >= 55) kind = 'likely_person'
  return { score: a.score, kind, reasons: a.reasons }
}

/**
 * Admin bulk "reject companies": strong unsuitable / company only.
 */
export function shouldKeepAsSoloProspect(
  name: string,
  businessName?: string | null,
): boolean {
  const a = assessProspectFit({ name, businessName })
  return a.fitClass !== 'unsuitable'
}

/**
 * Discovery keep gate: store suitable + needs_review (+ unknown with phone).
 * Unsuitable clear retail/chains are dropped (logged via sightings).
 * Landline does NOT block keep — contactability is separate.
 */
export function shouldKeepDiscoveredProspect(input: {
  name: string
  businessName?: string | null
  phone?: string | null
  websiteUrl?: string | null
  address?: string | null
  placeTypes?: string[] | null
  pureServiceAreaBusiness?: boolean | null
  searchAreaHint?: string | null
}): boolean {
  const a = assessProspectFit(input)
  if (a.fitClass === 'unsuitable') return false
  // Require some identity signal to avoid empty junk rows
  if (!input.name?.trim()) return false
  return true
}

export function fitClassLabelHe(fitClass: FitClass | null | undefined): string {
  switch (fitClass) {
    case 'suitable':
      return 'מתאים'
    case 'needs_review':
      return 'דורש בדיקה'
    case 'unsuitable':
      return 'לא מתאים'
    case 'unknown':
      return 'לא ידוע'
    default:
      return 'לא ידוע'
  }
}

export function contactabilityLabelHe(
  c: Contactability | null | undefined,
): string {
  switch (c) {
    case 'mobile':
      return 'נייד'
    case 'landline':
      return 'קווי'
    case 'none':
      return 'אין טלפון'
    default:
      return 'לא ידוע'
  }
}
