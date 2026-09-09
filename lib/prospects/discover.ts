import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import { GooglePlacesProspectAdapter } from '@/lib/prospects/adapters/google-places'
import { OsmOverpassProspectAdapter } from '@/lib/prospects/adapters/osm-overpass'
import {
  clearReplaceableAutoProspects,
  ingestFromAdapter,
  type IngestResult,
} from '@/lib/prospects/service'
import { getDiscoveryCity } from '@/lib/prospects/discovery-mapping'
import {
  getDiscoveryPerCategoryCap,
  getDiscoveryTotalBudget,
  getRecruitCategorySlugs,
} from '@/lib/prospects/config'
import { scorePersonFit } from '@/lib/prospects/person-score'

export type DiscoveryTrigger = 'cron' | 'manual'

export type DiscoveryRunResult = {
  runId: string | null
  status: 'completed' | 'failed'
  city: string
  sources: string[]
  found: number
  created: number
  skipped: number
  errors: number
  deletedPrevious: number
  budget: number
  errorMessage?: string
  bySource: Record<
    string,
    {
      found: number
      created: number
      skipped: number
      errors: string[]
      stats?: Record<string, number | string[] | undefined>
    }
  >
}

function buildAdapters(input?: {
  sources?: Array<'google_places' | 'osm'>
  categorySlugs?: string[]
  city?: string
  totalBudget?: number
}): ProspectSourceAdapter[] {
  const wanted = new Set(input?.sources ?? ['google_places', 'osm'])
  const adapters: ProspectSourceAdapter[] = []
  const budget = input?.totalBudget ?? getDiscoveryTotalBudget()
  const categorySlugs = input?.categorySlugs ?? getRecruitCategorySlugs()
  const common = {
    categorySlugs,
    city: input?.city ?? getDiscoveryCity(),
    totalBudget: budget,
    perCategoryLimit: Math.min(
      Math.ceil(budget / Math.max(1, categorySlugs.length)),
      getDiscoveryPerCategoryCap(),
    ),
  }

  if (wanted.has('google_places')) {
    if (process.env.GOOGLE_PLACES_API_KEY?.trim()) {
      adapters.push(new GooglePlacesProspectAdapter(common))
    }
  }
  if (wanted.has('osm')) {
    adapters.push(new OsmOverpassProspectAdapter(common))
  }

  return adapters
}

export async function runProspectDiscovery(
  admin: SupabaseClient,
  options: {
    trigger: DiscoveryTrigger
    actorUserId?: string | null
    sources?: Array<'google_places' | 'osm'>
    categorySlugs?: string[]
    city?: string
    /** Default true: wipe prior Places/OSM leads that were not contacted yet */
    replacePrevious?: boolean
  },
): Promise<DiscoveryRunResult> {
  const city = options.city ?? getDiscoveryCity()
  const budget = getDiscoveryTotalBudget()
  const replacePrevious = options.replacePrevious !== false
  const adapters = buildAdapters({
    sources: options.sources,
    categorySlugs: options.categorySlugs,
    city,
    totalBudget: budget,
  })

  const sourceNames = adapters.map((a) => a.name)
  let runId: string | null = null
  let deletedPrevious = 0

  const { data: runRow } = await admin
    .from('prospect_discovery_runs')
    .insert({
      trigger: options.trigger,
      sources: sourceNames,
      city,
      status: 'running',
      actor_user_id: options.actorUserId ?? null,
    })
    .select('id')
    .maybeSingle()

  runId = runRow?.id ?? null

  const bySource: DiscoveryRunResult['bySource'] = {}
  let found = 0
  let created = 0
  let skipped = 0
  let errors = 0
  const topErrors: string[] = []

  if (adapters.length === 0) {
    const msg =
      'אין מקורות זמינים — הגדר GOOGLE_PLACES_API_KEY או הפעל מקור OSM'
    if (runId) {
      await admin
        .from('prospect_discovery_runs')
        .update({
          status: 'failed',
          error_message: msg,
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }
    return {
      runId,
      status: 'failed',
      city,
      sources: sourceNames,
      found: 0,
      created: 0,
      skipped: 0,
      errors: 1,
      deletedPrevious: 0,
      budget,
      errorMessage: msg,
      bySource,
    }
  }

  try {
    if (replacePrevious) {
      const cleared = await clearReplaceableAutoProspects(admin)
      deletedPrevious = cleared.deleted
    }

    for (const adapter of adapters) {
      bySource[adapter.name] = {
        found: 0,
        created: 0,
        skipped: 0,
        errors: [],
      }
      try {
        const records = await adapter.fetchRecords()
        records.sort((a, b) => {
          const sa = a.fitScore ?? scorePersonFit(a.name, a.businessName).score
          const sb = b.fitScore ?? scorePersonFit(b.name, b.businessName).score
          return sb - sa
        })
        bySource[adapter.name].found = records.length
        found += records.length

        if (adapter instanceof GooglePlacesProspectAdapter) {
          const s = adapter.lastStats
          bySource[adapter.name].stats = {
            rawFetched: s.rawFetched,
            uniquePlaces: s.uniquePlaces,
            rejectedNoPhone: s.rejectedNoPhone,
            rejectedFilter: s.rejectedFilter,
            kept: s.kept,
            searchCalls: s.searchCalls,
          }
          if (s.searchErrors.length > 0) {
            bySource[adapter.name].errors.push(...s.searchErrors.slice(0, 5))
            errors += s.searchErrors.length
            topErrors.push(
              ...s.searchErrors.slice(0, 3).map((e) => `google_places: ${e}`),
            )
          }
        }
        if (adapter instanceof OsmOverpassProspectAdapter) {
          if (adapter.lastCategoryErrors.length > 0) {
            bySource[adapter.name].errors.push(
              ...adapter.lastCategoryErrors.slice(0, 5),
            )
            errors += adapter.lastCategoryErrors.length
            topErrors.push(
              ...adapter.lastCategoryErrors
                .slice(0, 3)
                .map((e) => `osm: ${e}`),
            )
          }
        }

        const wrap: ProspectSourceAdapter = {
          name: adapter.name,
          fetchRecords: async () => records,
        }
        const result: IngestResult = await ingestFromAdapter(
          admin,
          wrap,
          options.actorUserId,
        )
        bySource[adapter.name].created = result.created.length
        bySource[adapter.name].skipped = result.skipped.length
        bySource[adapter.name].errors.push(
          ...result.errors.map((e) => e.error),
        )
        created += result.created.length
        skipped += result.skipped.length
        errors += result.errors.length
        topErrors.push(
          ...result.errors.map((e) => `${adapter.name}: ${e.error}`),
        )
      } catch (e) {
        const message = e instanceof Error ? e.message : 'source failed'
        bySource[adapter.name].errors.push(message)
        errors += 1
        topErrors.push(`${adapter.name}: ${message}`)
      }
    }

    if (runId) {
      await admin
        .from('prospect_discovery_runs')
        .update({
          status: 'completed',
          found_count: found,
          created_count: created,
          skipped_count: skipped,
          error_count: errors,
          error_message: topErrors[0] ?? null,
          details: {
            bySource,
            deletedPrevious,
            budget,
            allErrors: topErrors.slice(0, 12),
          },
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    return {
      runId,
      status: 'completed',
      city,
      sources: sourceNames,
      found,
      created,
      skipped,
      errors,
      deletedPrevious,
      budget,
      errorMessage: topErrors[0],
      bySource,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'discovery failed'
    if (runId) {
      await admin
        .from('prospect_discovery_runs')
        .update({
          status: 'failed',
          found_count: found,
          created_count: created,
          skipped_count: skipped,
          error_count: errors + 1,
          error_message: message,
          details: {
            bySource,
            deletedPrevious,
            budget,
            allErrors: [...topErrors, message].slice(0, 12),
          },
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }
    return {
      runId,
      status: 'failed',
      city,
      sources: sourceNames,
      found,
      created,
      skipped,
      errors: errors + 1,
      deletedPrevious,
      budget,
      errorMessage: message,
      bySource,
    }
  }
}

export async function listDiscoveryRuns(
  admin: SupabaseClient,
  limit = 10,
) {
  const { data, error } = await admin
    .from('prospect_discovery_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
