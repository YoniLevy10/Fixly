import type { AssignmentMode } from './types'

/**
 * Partner-facing `assignment_mode` → internal Fixly `match_mode`.
 * Both partner modes create candidate offers (multi). Single-pro pick stays consumer-only.
 */
export function assignmentModeToMatchMode(
  mode: AssignmentMode,
): 'single' | 'multi' {
  switch (mode) {
    case 'broadcast_first_accept':
    case 'manual_select':
      return 'multi'
    default:
      return 'multi'
  }
}
