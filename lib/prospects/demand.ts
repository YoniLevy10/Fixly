import type { SupabaseClient } from '@supabase/supabase-js'

const OPEN_STATUSES = ['pending', 'accepted', 'on_the_way', 'in_progress'] as const

/**
 * Count real open requests for the same category + city.
 * Returns 0 when inputs are missing or the query fails — never invents demand.
 */
export async function countMatchingOpenRequests(
  admin: SupabaseClient,
  input: { categoryId: string | null; city: string | null },
): Promise<number> {
  if (!input.categoryId || !input.city?.trim()) return 0

  const { count, error } = await admin
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', input.categoryId)
    .ilike('city', input.city.trim())
    .in('status', [...OPEN_STATUSES])

  if (error) {
    console.warn('[prospects] demand count failed', error.message)
    return 0
  }

  return count ?? 0
}
