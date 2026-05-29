/**
 * Rich mock dataset — makes the app feel alive without Supabase seed.
 *
 * ON when:
 * - NEXT_PUBLIC_FF_DEMO_DATA=true|1
 * - or unset (default ON for investor / preview builds)
 *
 * OFF only when explicitly: NEXT_PUBLIC_FF_DEMO_DATA=false
 */
export function isDemoDataMode(): boolean {
  const raw = process.env.NEXT_PUBLIC_FF_DEMO_DATA?.trim().toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'off') return false
  if (raw === 'true' || raw === '1' || raw === 'on') return true
  return true
}
