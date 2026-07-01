import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

export type MatchCandidate = {
  professionalId: string
  rank: number
  name: string
  rating: number
}

/** Find top N available pros by category + city, preferring verified and fast responders */
export async function findMatchingCandidates(input: {
  categoryId?: string | null
  city?: string | null
  limit?: number
}): Promise<MatchCandidate[]> {
  const limit = input.limit ?? 3
  const supabase = (await createServerSupabaseClient()) ?? getAdminSupabaseClient()
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
