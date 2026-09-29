/**
 * Monthly public-signup goal (customers + professionals on pro_waitlist).
 * Window: next ~30 days from the lead-capture rebuild launch.
 */

export const MONTHLY_SIGNUP_GOAL = {
  target: 10,
  /** Inclusive start (UTC date). */
  startIso: '2026-09-29T00:00:00.000Z',
  /** Inclusive end (UTC). */
  endIso: '2026-10-29T23:59:59.999Z',
  labelHe: 'יעד חודשי — 10 נרשמים אמיתיים',
  labelEn: 'Monthly goal — 10 real signups',
} as const

const EXCLUDED_SOURCES = new Set([
  'smoke_waitlist_save',
  'smoke',
  'test',
  'e2e',
])

export function getMonthlyGoalWindow(): { start: Date; end: Date } {
  return {
    start: new Date(MONTHLY_SIGNUP_GOAL.startIso),
    end: new Date(MONTHLY_SIGNUP_GOAL.endIso),
  }
}

export function isExcludedSignupSource(source: string | null | undefined): boolean {
  if (!source) return false
  const s = source.trim().toLowerCase()
  if (EXCLUDED_SOURCES.has(s)) return true
  return s.startsWith('smoke_') || s.startsWith('test_')
}

/** Count only rows that look like real people in the goal window. */
export function isCountableGoalSignup(row: {
  full_name?: string | null
  phone?: string | null
  source?: string | null
  created_at?: string | null
}): boolean {
  if (isExcludedSignupSource(row.source)) return false
  const created = row.created_at ? new Date(row.created_at) : null
  if (!created || Number.isNaN(created.getTime())) return false
  const { start, end } = getMonthlyGoalWindow()
  if (created < start || created > end) return false

  const name = (row.full_name ?? '').trim()
  const phone = (row.phone ?? '').trim()
  if (name.length < 2 || phone.length < 7) return false
  // Gibberish ASCII blobs (legacy spam rows)
  if (
    name.length >= 12 &&
    !/\s/.test(name) &&
    !/[\u0590-\u05FF]/.test(name) &&
    /^[a-zA-Z]+$/.test(name)
  ) {
    return false
  }
  const digits = phone.replace(/\D/g, '')
  const ilOk =
    (digits.length === 10 && digits.startsWith('0')) ||
    (digits.length === 9 && /^[2-9]/.test(digits)) ||
    (digits.length >= 11 && digits.startsWith('972'))
  if (!ilOk) return false
  return true
}

export function summarizeGoalProgress(count: number): {
  target: number
  count: number
  remaining: number
  pct: number
  hit: boolean
} {
  const target = MONTHLY_SIGNUP_GOAL.target
  const safe = Math.max(0, count)
  return {
    target,
    count: safe,
    remaining: Math.max(0, target - safe),
    pct: Math.min(100, Math.round((safe / target) * 100)),
    hit: safe >= target,
  }
}
