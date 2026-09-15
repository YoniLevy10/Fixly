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
  // Home-visit personal services (people invite to the home)
  'nails',
  'hair',
  'makeup',
  'home_tutor',
] as const

/** Marketplace-only / low recruit priority (not typical home fault callouts). */
export const LOW_PRIORITY_RECRUIT_SLUGS = ['elevators', 'computers', 'general'] as const

export const RECRUIT_PER_CATEGORY_TARGET = 10

export const RECRUIT_TOTAL_TARGET =
  CORE_RECRUIT_CATEGORY_SLUGS.length * RECRUIT_PER_CATEGORY_TARGET

/**
 * Per-chunk budgets — discovery runs as many short Vercel invocations
 * (continue loop) instead of one 300s monolith that gets killed.
 */
/** Raw Places results soft cap per chunk (before filter). */
export const DISCOVERY_TOTAL_BUDGET = 400

/** Soft cap per category after keep decision (per chunk). */
export const DISCOVERY_PER_CATEGORY_CAP = 40

/** Hard cap on Places HTTP calls per chunk. */
export const DISCOVERY_API_CALL_BUDGET = 40

/** Max Places search jobs to attempt in one chunk. */
export const DISCOVERY_CHUNK_MAX_JOBS = 20

/**
 * Soft wall-clock for one discovery chunk (ms).
 * Must stay well under Vercel `maxDuration` (300s).
 */
export const DISCOVERY_WALL_CLOCK_MS = 55_000

/**
 * Absolute max age of a `running` row by started_at (ms).
 * Must be ABOVE Vercel maxDuration so a healthy long continue-chain
 * is never age-killed while heartbeats are fresh.
 */
export const DISCOVERY_STALE_LOCK_MS = 360_000

/**
 * If progress heartbeat is older than this, treat the run as dead.
 * Primary unlock signal (not started_at).
 */
export const DISCOVERY_HEARTBEAT_STALE_MS = 90_000

/** Leave this much wall-clock for ingest + DB finalize inside a chunk. */
export const DISCOVERY_FINALIZE_BUFFER_MS = 12_000

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
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 2000)
  return DISCOVERY_TOTAL_BUDGET
}

export function getDiscoveryPerCategoryCap(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_PER_CATEGORY_CAP)
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 120)
  return DISCOVERY_PER_CATEGORY_CAP
}

export function getDiscoveryApiCallBudget(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_API_CALL_BUDGET)
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 120)
  return DISCOVERY_API_CALL_BUDGET
}

export function getDiscoveryChunkMaxJobs(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_CHUNK_MAX_JOBS)
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 80)
  return DISCOVERY_CHUNK_MAX_JOBS
}

export function getDiscoveryWallClockMs(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_WALL_CLOCK_MS)
  if (Number.isFinite(n) && n >= 20_000) return Math.min(Math.floor(n), 120_000)
  return DISCOVERY_WALL_CLOCK_MS
}

export function getDiscoveryStaleLockMs(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_STALE_LOCK_MS)
  if (Number.isFinite(n) && n >= 60_000) return Math.min(Math.floor(n), 3_600_000)
  return DISCOVERY_STALE_LOCK_MS
}

export function getDiscoveryHeartbeatStaleMs(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_HEARTBEAT_STALE_MS)
  if (Number.isFinite(n) && n >= 20_000) return Math.min(Math.floor(n), 300_000)
  return DISCOVERY_HEARTBEAT_STALE_MS
}

export function getDiscoveryFinalizeBufferMs(): number {
  const n = Number(process.env.FIXLY_DISCOVERY_FINALIZE_BUFFER_MS)
  if (Number.isFinite(n) && n >= 5_000) return Math.min(Math.floor(n), 40_000)
  return DISCOVERY_FINALIZE_BUFFER_MS
}
