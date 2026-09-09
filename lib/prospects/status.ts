import type { ProspectStatus } from '@/lib/prospects/types'

/** Funnel order for statuses that progress forward (excludes terminal rejects). */
const FUNNEL_ORDER: ProspectStatus[] = [
  'discovered',
  'verified',
  'approved',
  'contacted',
  'interested',
  'joined',
  'active',
]

const TERMINAL: ProspectStatus[] = ['rejected', 'do_not_contact']

export function isContactAllowed(status: ProspectStatus): boolean {
  const idx = FUNNEL_ORDER.indexOf(status)
  if (idx < 0) return false
  return idx >= FUNNEL_ORDER.indexOf('approved')
}

export function canTransition(
  from: ProspectStatus,
  to: ProspectStatus,
): boolean {
  if (from === to) return true
  if (TERMINAL.includes(from)) {
    // allow reopen from rejected/dnc back to discovered only
    return to === 'discovered'
  }
  if (TERMINAL.includes(to)) return true

  const fromIdx = FUNNEL_ORDER.indexOf(from)
  const toIdx = FUNNEL_ORDER.indexOf(to)
  if (fromIdx < 0 || toIdx < 0) return false

  // Allow forward moves and small corrections within the funnel
  return Math.abs(toIdx - fromIdx) <= 2 || toIdx > fromIdx
}

export function assertTransition(
  from: ProspectStatus,
  to: ProspectStatus,
): { ok: true } | { ok: false; error: string } {
  if (!canTransition(from, to)) {
    return { ok: false, error: `מעבר סטטוס לא מורשה: ${from} → ${to}` }
  }
  return { ok: true }
}
