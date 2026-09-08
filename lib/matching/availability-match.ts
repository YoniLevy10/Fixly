/**
 * Weekly availability rules vs preferred slot on a request.
 */

export type AvailabilityRule = {
  day_of_week: number // 0=Sun … 6=Sat
  start_time: string // HH:MM or HH:MM:SS
  end_time: string
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => Number(x))
  return (h || 0) * 60 + (m || 0)
}

/**
 * Returns true if the pro has no rules (treat as flexible) OR has a rule
 * covering preferredDate + preferredTime.
 * If only preferredDate is set, any rule on that weekday counts.
 */
export function matchesAvailability(
  rules: AvailabilityRule[] | null | undefined,
  preferredDate?: string | null,
  preferredTime?: string | null,
): boolean {
  if (!preferredDate && !preferredTime) return true
  if (!rules || rules.length === 0) return true
  if (!preferredDate) return true

  const d = new Date(`${preferredDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return true
  const dow = d.getDay()
  const dayRules = rules.filter((r) => r.day_of_week === dow)
  if (dayRules.length === 0) return false

  if (!preferredTime) return true

  const pref = parseTimeToMinutes(preferredTime.slice(0, 5))
  return dayRules.some((r) => {
    const start = parseTimeToMinutes(String(r.start_time).slice(0, 5))
    const end = parseTimeToMinutes(String(r.end_time).slice(0, 5))
    return pref >= start && pref <= end
  })
}
