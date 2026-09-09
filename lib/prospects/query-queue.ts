/**
 * Budgeted Places query rotation — prefer high-yield keys, keep explore slice.
 */

import {
  DISCOVERY_QUERY_EXPLORE_RATIO,
  getDiscoveryApiCallBudget,
} from '@/lib/prospects/config'
import type { PlacesSearchJob } from '@/lib/prospects/discovery-mapping'

export type QueryStatRow = {
  query_key: string
  yield_score?: number | null
  suitable_count?: number | null
  unique_new_count?: number | null
  raw_count?: number | null
  last_run_at?: string | null
}

export type QueryYieldUpdate = {
  queryKey: string
  city: string
  sourceName: string
  raw: number
  uniqueNew: number
  suitable: number
  needsReview: number
  unsuitable: number
  apiCalls: number
}

/**
 * Select up to `apiCallBudget` jobs: ~85% by historical yield, ~15% explore.
 * Jobs never seen before are treated as explore candidates.
 */
export function selectJobsForBudget(
  jobs: PlacesSearchJob[],
  stats: QueryStatRow[],
  apiCallBudget = getDiscoveryApiCallBudget(),
): PlacesSearchJob[] {
  if (jobs.length === 0 || apiCallBudget <= 0) return []

  const byKey = new Map(stats.map((s) => [s.query_key, s]))
  const scored = jobs.map((job, index) => {
    const s = byKey.get(job.queryKey)
    const yieldScore = Number(s?.yield_score ?? 0)
    const seen = Boolean(s?.last_run_at) || (s?.raw_count ?? 0) > 0
    return { job, index, yieldScore, seen }
  })

  const exploit = scored
    .filter((s) => s.seen)
    .sort((a, b) => b.yieldScore - a.yieldScore || a.index - b.index)
  const explore = scored
    .filter((s) => !s.seen)
    .sort((a, b) => a.index - b.index)

  // Also explore low-yield seen jobs occasionally
  const lowYieldSeen = exploit.filter((s) => s.yieldScore < 0.15).slice(-10)

  const exploreSlots = Math.max(
    1,
    Math.floor(apiCallBudget * DISCOVERY_QUERY_EXPLORE_RATIO),
  )
  const exploitSlots = Math.max(0, apiCallBudget - exploreSlots)

  const picked: PlacesSearchJob[] = []
  const used = new Set<string>()

  const take = (list: typeof scored, n: number) => {
    for (const item of list) {
      if (picked.length >= n) break
      if (used.has(item.job.queryKey + item.job.textQuery)) continue
      used.add(item.job.queryKey + item.job.textQuery)
      picked.push(item.job)
    }
  }

  take(exploit, exploitSlots)
  take([...explore, ...lowYieldSeen], apiCallBudget)
  // Fill remainder with remaining exploit
  take(scored, apiCallBudget)

  return picked.slice(0, apiCallBudget)
}

export function computeYieldScore(input: {
  raw: number
  uniqueNew: number
  suitable: number
  needsReview: number
}): number {
  if (input.raw <= 0) return 0
  const useful = input.suitable * 1.0 + input.needsReview * 0.45 + input.uniqueNew * 0.25
  return Math.round((useful / input.raw) * 1000) / 1000
}
