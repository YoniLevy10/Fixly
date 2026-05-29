/**
 * Rich mock dataset — makes the app feel alive without Supabase seed.
 * Set NEXT_PUBLIC_FF_DEMO_DATA=true in .env.local
 */
export function isDemoDataMode(): boolean {
  const v = process.env.NEXT_PUBLIC_FF_DEMO_DATA?.trim().toLowerCase()
  return v === 'true' || v === '1'
}
