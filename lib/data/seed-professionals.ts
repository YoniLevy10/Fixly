import { DEMO_SUPABASE_PROFESSIONAL_ID } from '@/lib/auth/constants'

/** Seeded demo professional UUID prefix used in production seed data. */
const SEED_PRO_ID_PREFIX = '10000000-0000-4000-8000-'

/**
 * True for the four seed demo profiles (יוסי כהן וכו׳) — not organic supply.
 */
export function isSeedDemoProfessionalId(id: string): boolean {
  return id === DEMO_SUPABASE_PROFESSIONAL_ID || id.startsWith(SEED_PRO_ID_PREFIX)
}
