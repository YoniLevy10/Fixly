/**
 * Rolling 30-day public-signup goal (professionals on pro_waitlist).
 */

export const MONTHLY_SIGNUP_GOAL = {
  target: 10,
  /** Rolling window length in days. */
  windowDays: 30,
  labelHe: 'יעד 30 יום — 10 נרשמים אמיתיים',
  labelEn: '30-day goal — 10 real signups',
} as const

const EXCLUDED_SOURCES = new Set([
  'smoke_waitlist_save',
  'smoke',
  'test',
  'e2e',
])

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function getMonthlyGoalWindow(now = new Date()): { start: Date; end: Date } {
  const end = new Date(now.getTime())
  const start = new Date(end.getTime() - MONTHLY_SIGNUP_GOAL.windowDays * MS_PER_DAY)
  return { start, end }
}

export function isExcludedSignupSource(source: string | null | undefined): boolean {
  if (!source) return false
  const s = source.trim().toLowerCase()
  if (EXCLUDED_SOURCES.has(s)) return true
  return s.startsWith('smoke_') || s.startsWith('test_')
}

/** Count only rows that look like real people in the goal window. */
export function isCountableGoalSignup(
  row: {
    full_name?: string | null
    phone?: string | null
    source?: string | null
    created_at?: string | null
  },
  now = new Date(),
): boolean {
  if (isExcludedSignupSource(row.source)) return false
  const created = row.created_at ? new Date(row.created_at) : null
  if (!created || Number.isNaN(created.getTime())) return false
  const { start, end } = getMonthlyGoalWindow(now)
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
