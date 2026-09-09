import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueryYieldUpdate } from '@/lib/prospects/query-queue'
import { computeYieldScore } from '@/lib/prospects/query-queue'

export async function upsertQueryStats(
  admin: SupabaseClient,
  yields: QueryYieldUpdate[],
): Promise<void> {
  for (const y of yields) {
    if (!y.queryKey) continue
    const yieldScore = computeYieldScore(y)
    const { data: existing } = await admin
      .from('prospect_query_stats')
      .select(
        'raw_count, unique_new_count, suitable_count, needs_review_count, unsuitable_count, api_calls',
      )
      .eq('query_key', y.queryKey)
      .eq('city', y.city)
      .eq('source_name', y.sourceName)
      .maybeSingle()

    const row = {
      query_key: y.queryKey,
      city: y.city,
      source_name: y.sourceName,
      raw_count: (existing?.raw_count ?? 0) + y.raw,
      unique_new_count: (existing?.unique_new_count ?? 0) + y.uniqueNew,
      suitable_count: (existing?.suitable_count ?? 0) + y.suitable,
      needs_review_count: (existing?.needs_review_count ?? 0) + y.needsReview,
      unsuitable_count: (existing?.unsuitable_count ?? 0) + y.unsuitable,
      api_calls: (existing?.api_calls ?? 0) + y.apiCalls,
      yield_score: yieldScore,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await admin.from('prospect_query_stats').upsert(row, {
      onConflict: 'query_key,city,source_name',
    })
  }
}

export async function loadQueryStats(
  admin: SupabaseClient,
  city: string,
): Promise<
  Array<{
    query_key: string
    yield_score: number | null
    suitable_count: number | null
    unique_new_count: number | null
    raw_count: number | null
    last_run_at: string | null
  }>
> {
  const { data } = await admin
    .from('prospect_query_stats')
    .select(
      'query_key, yield_score, suitable_count, unique_new_count, raw_count, last_run_at',
    )
    .eq('city', city)
    .eq('source_name', 'google_places')
  return data ?? []
}

export async function hasRunningDiscovery(
  admin: SupabaseClient,
): Promise<boolean> {
  const { data } = await admin
    .from('prospect_discovery_runs')
    .select('id')
    .eq('status', 'running')
    .limit(1)
  return (data?.length ?? 0) > 0
}
