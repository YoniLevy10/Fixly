import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueryYieldUpdate } from '@/lib/prospects/query-queue'
import { computeYieldScore } from '@/lib/prospects/query-queue'
import {
  getDiscoveryHeartbeatStaleMs,
  getDiscoveryStaleLockMs,
} from '@/lib/prospects/config'

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

function heartbeatAtMs(details: unknown): number | null {
  if (!details || typeof details !== 'object') return null
  const raw = (details as { heartbeatAt?: unknown }).heartbeatAt
  if (typeof raw !== 'string' || !raw.trim()) return null
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : null
}

export function isDiscoveryRunStale(
  row: { started_at: string; details?: unknown },
  nowMs: number = Date.now(),
  opts?: { maxAgeMs?: number; heartbeatStaleMs?: number },
): boolean {
  const maxAgeMs = opts?.maxAgeMs ?? getDiscoveryStaleLockMs()
  const heartbeatStaleMs = opts?.heartbeatStaleMs ?? getDiscoveryHeartbeatStaleMs()
  const started = Date.parse(row.started_at)
  if (!Number.isFinite(started)) return true

  const hb = heartbeatAtMs(row.details)

  // Fresh heartbeat ⇒ alive, even if started_at is old (multi-chunk runs).
  if (hb != null && nowMs - hb < heartbeatStaleMs) return false

  // Dead heartbeat ⇒ unlock.
  if (hb != null && nowMs - hb >= heartbeatStaleMs) return true

  // No heartbeat yet: short grace for first progress write, then unlock.
  if (nowMs - started >= Math.min(45_000, heartbeatStaleMs)) return true

  // Absolute abandonment (past Vercel maxDuration + skew).
  if (nowMs - started >= maxAgeMs) return true

  return false
}

/**
 * Mark abandoned `running` rows as failed so a killed serverless invocation
 * cannot block discovery forever. Uses started_at AND progress heartbeat.
 */
export async function releaseStaleDiscoveryRuns(
  admin: SupabaseClient,
  maxAgeMs: number = getDiscoveryStaleLockMs(),
): Promise<number> {
  const { data: running, error } = await admin
    .from('prospect_discovery_runs')
    .select('id, started_at, details')
    .eq('status', 'running')
  if (error || !running?.length) return 0

  const now = Date.now()
  const staleIds = running
    .filter((row) =>
      isDiscoveryRunStale(row, now, {
        maxAgeMs,
        heartbeatStaleMs: getDiscoveryHeartbeatStaleMs(),
      }),
    )
    .map((row) => row.id)
  if (staleIds.length === 0) return 0

  const { data, error: updErr } = await admin
    .from('prospect_discovery_runs')
    .update({
      status: 'failed',
      error_message:
        'הנעילה שוחררה אוטומטית — הריצה הקודמת מתה בלי סיום (תהליך שרת נקטע)',
      finished_at: new Date().toISOString(),
    })
    .in('id', staleIds)
    .eq('status', 'running')
    .select('id')
  if (updErr) return 0
  return data?.length ?? 0
}

/** Immediate unlock — admin force-clear of every stuck `running` row. */
export async function forceUnlockDiscoveryRuns(
  admin: SupabaseClient,
): Promise<number> {
  const { data, error } = await admin
    .from('prospect_discovery_runs')
    .update({
      status: 'failed',
      error_message: 'נעילה שוחררה ידנית ע״י מנהל',
      finished_at: new Date().toISOString(),
    })
    .eq('status', 'running')
    .select('id')
  if (error) return 0
  return data?.length ?? 0
}

export async function hasRunningDiscovery(
  admin: SupabaseClient,
): Promise<boolean> {
  await releaseStaleDiscoveryRuns(admin).catch(() => 0)
  const { data } = await admin
    .from('prospect_discovery_runs')
    .select('id')
    .eq('status', 'running')
    .limit(1)
  return (data?.length ?? 0) > 0
}
