import { isProduction } from '@/lib/data/config'

/**
 * Rich mock dataset — makes the app feel alive without Supabase seed.
 *
 * Default:
 * - development: ON (investor preview / local dev)
 * - production: OFF (requires real Supabase)
 *
 * Override explicitly with NEXT_PUBLIC_FF_DEMO_DATA=true|false
 */
export function isDemoDataMode(): boolean {
  const raw = process.env.NEXT_PUBLIC_FF_DEMO_DATA?.trim().toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'off') return false
  if (raw === 'true' || raw === '1' || raw === 'on') return true
  return !isProduction()
}
