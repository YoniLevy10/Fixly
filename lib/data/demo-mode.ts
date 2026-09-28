/**
 * Demo / mock dataset mode.
 *
 * Production default: OFF (real Supabase).
 * Opt-in for investor tours / local showcase:
 *   NEXT_PUBLIC_FF_DEMO_DATA=true
 *
 * Hard kill (also forces OFF even if DEMO_DATA is set):
 *   NEXT_PUBLIC_FF_DEMO_KILL=true
 */
export function isDemoDataMode(): boolean {
  const kill = process.env.NEXT_PUBLIC_FF_DEMO_KILL?.trim().toLowerCase()
  if (kill === 'true' || kill === '1' || kill === 'on') return false

  const on = process.env.NEXT_PUBLIC_FF_DEMO_DATA?.trim().toLowerCase()
  return on === 'true' || on === '1' || on === 'on'
}
