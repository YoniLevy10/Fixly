/**
 * Tunable weights for prospect fit scoring.
 * Not scientific — calibrate from labeled samples.
 */

export const DEFAULT_RECRUIT_CITY = 'ירושלים'

/**
 * Home-service categories for Jerusalem soft-launch recruitment.
 */
export const CORE_RECRUIT_CATEGORY_SLUGS = [
  'plumbing',
  'electricity',
  'ac',
  'cleaning',
  'painting',
  'carpentry',
  'locksmith',
  'gardening',
  'moving',
  'tiling',
  'renovations',
  'waterproofing',
  'aluminum',
  'drywall',
  'solar',
  'appliance_repair',
  'pest_control',
  'glazing',
  'furniture',
] as const

export const RECRUIT_PER_CATEGORY_TARGET = 10

export const RECRUIT_TOTAL_TARGET =
  CORE_RECRUIT_CATEGORY_SLUGS.length * RECRUIT_PER_CATEGORY_TARGET

/** Raw Places results soft cap (before filter). */
export const DISCOVERY_TOTAL_BUDGET = 1200

/** Soft cap per category after keep decision. */
export const DISCOVERY_PER_CATEGORY_CAP = 120

/** Hard cap on Places HTTP calls per discovery run. */
export const DISCOVERY_API_CALL_BUDGET = 80

/** Share of query budget reserved for experimental / low-stats queries. */
export const DISCOVERY_QUERY_EXPLORE_RATIO = 0.15

export const JOIN_URL = 'https://fixly.tech/pro/join'

/** Fit scorer weights (0–100 scale contributions). */
export const FIT_WEIGHTS = {
  serviceAtCustomer: 28,
  businessTypePerformer: 22,
  businessTypeRetailPenalty: -40,
  businessTypeCompanyPenalty: -35,
  evidencePhone: 12,
  evidenceWebsite: 8,
  evidenceAddress: 6,
  evidenceSab: 14,
  areaHint: 8,
  personNameBonus: 10,
  ambiguousName: 0,
} as const

export function getRecruitCity(): string {
  return process.env.FIXLY_RECRUIT_CITY?.trim() || DEFAULT_RECRUIT_CITY
}

export function getRecruitCategorySlugs(): string[] {
  const raw = process.env.FIXLY_RECRUIT_CATEGORY_SLUGS?.trim()
  if (!raw) return [...CORE_RECRUIT_CATEGORY_SLUGS]
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function getRecruitPerCategoryTarget(): number {
  const n = Number(process.env.FIXLY_RECRUIT_PER_CATEGORY_TARGET)
  if (Number.isFinite(n) && n > 0) return Math.floor(n)
  return RECRUIT_PER_CATEGORY_TARGET
}

export function getDiscoveryTotalBudget(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_TOTAL_BUDGET)
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 3000)
  return DISCOVERY_TOTAL_BUDGET
}

export function getDiscoveryPerCategoryCap(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_PER_CATEGORY_CAP)
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 250)
  return DISCOVERY_PER_CATEGORY_CAP
}

export function getDiscoveryApiCallBudget(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_API_CALL_BUDGET)
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 400)
  return DISCOVERY_API_CALL_BUDGET
}
