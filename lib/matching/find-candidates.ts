import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

export type MatchCandidate = {
  professionalId: string
  rank: number
  name: string
  rating: number
}

type MatchInput = {
  categoryId?: string | null
  city?: string | null
  limit?: number
  /**
   * Prefer service-role client (partner / cron routes without user session).
   * Default: cookie session client, then admin fallback.
   */
  preferAdmin?: boolean
  /** Injected client for tests */
  client?: SupabaseClient | null
}

async function resolveClient(input: MatchInput): Promise<SupabaseClient | null> {
  if (input.client) return input.client
  if (input.preferAdmin) {
    return getAdminSupabaseClient() ?? (await createServerSupabaseClient())
  }
  return (await createServerSupabaseClient()) ?? getAdminSupabaseClient()
}

/** Single matching engine: category + city, prefer verified / fast / rating */
export async function findMatchingCandidates(
  input: MatchInput,
): Promise<MatchCandidate[]> {
  const limit = input.limit ?? 3
  const supabase = await resolveClient(input)
  if (!supabase) return []

  let query = supabase
    .from('professionals')
    .select('id, title, rating, city, available, is_verified, avg_response_minutes, category_id')
    .eq('available', true)
    .order('is_verified', { ascending: false })
    .order('avg_response_minutes', { ascending: true, nullsFirst: false })
    .order('rating', { ascending: false })
    .limit(limit * 2)

  if (input.categoryId) {
    query = query.eq('category_id', input.categoryId)
  }
  if (input.city) {
    query = query.ilike('city', `%${input.city}%`)
  }

  const { data } = await query
  const rows = data ?? []

  return rows.slice(0, limit).map((row, i) => ({
    professionalId: row.id as string,
    rank: i + 1,
    name: (row.title as string) ?? 'Pro',
    rating: Number(row.rating ?? 0),
  }))
}
