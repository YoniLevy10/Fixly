/**
 * Mock marketplace catalog (professionals, featured, reviews for those profiles).
 *
 * Independent from full demo mode:
 * - Production can keep real Supabase requests/auth
 * - while still showing the rich mock professional catalog
 *
 * Default: ON (so the marketplace never looks empty).
 * Opt-out: NEXT_PUBLIC_FF_MOCK_CATALOG=false
 */
export function isMockCatalogEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_FF_MOCK_CATALOG?.trim().toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'off') return false
  return true
}
