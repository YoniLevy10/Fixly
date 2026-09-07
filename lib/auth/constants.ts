/** Stable guest user id in Supabase `users` table */
export const GUEST_USER_ID = '00000000-0000-4000-8000-000000000001'

/**
 * Investor-demo pro id — matches mock catalog (`mock/professionals`, demo-seed id `"1"`).
 * Claim in demo mode binds the local session to this id (no Supabase).
 */
export const DEMO_PROFESSIONAL_ID = '1'

/** Seeded Supabase pilot row (production claim / optional SQL seed) */
export const DEMO_SUPABASE_PROFESSIONAL_ID =
  '10000000-0000-4000-8000-000000000001'
