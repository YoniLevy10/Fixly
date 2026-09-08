import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  rankCandidates,
  type RankableCandidate,
} from '@/lib/matching/performance-score'
import { matchesAvailability } from '@/lib/matching/availability-match'
import { estimatePriceRange } from '@/lib/estimate/price-estimate'

export type MatchCandidate = {
  professionalId: string
  rank: number
  name: string
  rating: number
  performanceScore?: number
}

type MatchInput = {
  categoryId?: string | null
  city?: string | null
  limit?: number
  preferredDate?: string | null
  preferredTime?: string | null
  /** Category slug for price-fit estimate */
  categorySlug?: string | null
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

const SELECT_COLS =
  'id, title, rating, city, available, is_verified, avg_response_minutes, category_id, hourly_price, performance_score, accept_rate, jobs_completed'

/**
 * Single matching engine: domain + area + availability + price + objective performance.
 * See docs/DIFFERENTIATION.md
 */
export async function findMatchingCandidates(
  input: MatchInput,
): Promise<MatchCandidate[]> {
  const limit = input.limit ?? 3
  const supabase = await resolveClient(input)
  if (!supabase) return []

  let query = supabase
    .from('professionals')
    .select(SELECT_COLS)
    .eq('available', true)
    .order('performance_score', { ascending: false, nullsFirst: false })
    .limit(Math.max(limit * 5, 15))

  if (input.categoryId) {
    query = query.eq('category_id', input.categoryId)
  }
  if (input.city) {
    query = query.ilike('city', `%${input.city}%`)
  }

  const { data, error } = await query
  if (error) {
    // Schema may lag before migration — fall back without performance columns
    console.warn('[matching] query failed, retrying core columns', error.message)
    return findMatchingCandidatesLegacy(supabase, input, limit)
  }

  let rows = data ?? []

  // Availability filter when preferred slot is set
  if (input.preferredDate || input.preferredTime) {
    const ids = rows.map((r) => r.id as string)
    const { data: rules } = await supabase
      .from('pro_availability_rules')
      .select('professional_id, day_of_week, start_time, end_time')
      .in('professional_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

    const byPro = new Map<string, { day_of_week: number; start_time: string; end_time: string }[]>()
    for (const rule of rules ?? []) {
      const pid = rule.professional_id as string
      const list = byPro.get(pid) ?? []
      list.push({
        day_of_week: Number(rule.day_of_week),
        start_time: String(rule.start_time),
        end_time: String(rule.end_time),
      })
      byPro.set(pid, list)
    }

    rows = rows.filter((row) =>
      matchesAvailability(
        byPro.get(row.id as string),
        input.preferredDate,
        input.preferredTime,
      ),
    )
  }

  const estimateMid = (() => {
    if (!input.categorySlug) return null
    const range = estimatePriceRange(input.categorySlug)
    return range ? (range.min + range.max) / 2 : null
  })()

  const rankable: RankableCandidate[] = rows.map((row) => ({
    professionalId: row.id as string,
    name: (row.title as string) ?? 'Pro',
    rating: Number(row.rating ?? 0),
    isVerified: Boolean(row.is_verified),
    available: Boolean(row.available),
    avgResponseMinutes:
      row.avg_response_minutes != null ? Number(row.avg_response_minutes) : null,
    hourlyPrice: row.hourly_price != null ? Number(row.hourly_price) : null,
    performanceScore:
      row.performance_score != null ? Number(row.performance_score) : 50,
    acceptRate: row.accept_rate != null ? Number(row.accept_rate) : null,
    city: (row.city as string) ?? null,
    categoryId: (row.category_id as string) ?? null,
  }))

  const ranked = rankCandidates(rankable, { estimateMid }).slice(0, limit)

  return ranked.map((row, i) => ({
    professionalId: row.professionalId,
    rank: i + 1,
    name: row.name,
    rating: row.rating,
    performanceScore: row.performanceScore,
  }))
}

/** Pre-migration fallback: verified → response → rating */
async function findMatchingCandidatesLegacy(
  supabase: SupabaseClient,
  input: MatchInput,
  limit: number,
): Promise<MatchCandidate[]> {
  let query = supabase
    .from('professionals')
    .select('id, title, rating, city, available, is_verified, avg_response_minutes, category_id')
    .eq('available', true)
    .order('is_verified', { ascending: false })
    .order('avg_response_minutes', { ascending: true, nullsFirst: false })
    .order('rating', { ascending: false })
    .limit(limit * 2)

  if (input.categoryId) query = query.eq('category_id', input.categoryId)
  if (input.city) query = query.ilike('city', `%${input.city}%`)

  const { data } = await query
  return (data ?? []).slice(0, limit).map((row, i) => ({
    professionalId: row.id as string,
    rank: i + 1,
    name: (row.title as string) ?? 'Pro',
    rating: Number(row.rating ?? 0),
  }))
}
