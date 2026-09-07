/**
 * Rich mock dataset — makes the app feel alive without Supabase seed.
 *
 * Pre-funding default: ON everywhere (including production), so the investor
 * tour and demo booking flow work on fixly.tech without a separate Preview.
 *
 * Production may still have legacy `NEXT_PUBLIC_FF_DEMO_DATA=false` from the
 * marketing-ready launch — that value is ignored until funding.
 *
 * Kill-switch (after investment / real ops):
 *   NEXT_PUBLIC_FF_DEMO_KILL=true
 */
export function isDemoDataMode(): boolean {
  const kill = process.env.NEXT_PUBLIC_FF_DEMO_KILL?.trim().toLowerCase()
  if (kill === 'true' || kill === '1' || kill === 'on') return false
  return true
}
