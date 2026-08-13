import { isProduction, isSupabaseEnabled } from '@/lib/data/config'

/**
 * Rich mock dataset — makes the app feel alive without Supabase seed.
 *
 * Default:
 * - development: ON
 * - production without Supabase: ON (Glam MVP demo / investor preview)
 * - production with Supabase: OFF unless explicitly enabled
 *
 * Override with NEXT_PUBLIC_FF_DEMO_DATA=true|false
 */
export function isDemoDataMode(): boolean {
  const raw = process.env.NEXT_PUBLIC_FF_DEMO_DATA?.trim().toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'off') return false
  if (raw === 'true' || raw === '1' || raw === 'on') return true
  if (!isProduction()) return true
  // Production candidacy / preview deploys without DB still need a working demo
  return !isSupabaseEnabled()
}
