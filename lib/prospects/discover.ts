import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import { GooglePlacesProspectAdapter } from '@/lib/prospects/adapters/google-places'
import { OsmOverpassProspectAdapter } from '@/lib/prospects/adapters/osm-overpass'
import { BraveWebProspectAdapter } from '@/lib/prospects/adapters/brave-web'
import { GovPestControlProspectAdapter } from '@/lib/prospects/adapters/gov-pest-control'
import {
  clearReplaceableAutoProspects,
  ingestFromAdapter,
  type IngestResult,
} from '@/lib/prospects/service'
import { getDiscoveryCity } from '@/lib/prospects/discovery-mapping'
import {
  getDiscoveryApiCallBudget,
  getDiscoveryBraveCallBudget,
  getDiscoveryPerCategoryCap,
  getDiscoveryTotalBudget,
  getRecruitCategorySlugs,
} from '@/lib/prospects/config'
import { assessProspectFit } from '@/lib/prospects/fit-score'
import {
  hasRunningDiscovery,
  loadQueryStats,
  upsertQueryStats,
} from '@/lib/prospects/query-stats-store'

export type DiscoveryTrigger = 'cron' | 'manual'

export type DiscoveryAutoSource =
  | 'google_places'
  | 'osm'
  | 'brave_web'
  | 'gov_pest_control'

export type DiscoveryRunResult = {
  runId: string | null
  status: 'completed' | 'failed' | 'busy'
  city: string
  sources: string[]
  found: number
  created: number
  updated: number
  skipped: number
  errors: number
  deletedPrevious: number
  budget: number
  apiCallBudget: number
  errorMessage?: string
  bySource: Record<
    string,
    {
      found: number
      created: number
      updated: number
      skipped: number
      errors: string[]
      uniqueToSource?: number
      mergedIntoExisting?: number
      stats?: Record<string, number | string | string[] | null | undefined>
    }
  >
}

export type DiscoveryProgress = {
  percent: number
  phase:
    | 'starting'
    | 'places'
    | 'osm'
    | 'brave'
    | 'gov'
    | 'ingest'
    | 'done'
    | 'failed'
  labelHe: string
  apiCalls?: number
  apiCallBudget?: number
  jobsDone?: number
  jobsTotal?: number
}

function buildAdapters(input?: {
  sources?: DiscoveryAutoSource[]
  categorySlugs?: string[]
  city?: string
  totalBudget?: number
  apiCallBudget?: number
  queryStats?: Awaited<ReturnType<typeof loadQueryStats>>
  onPlacesProgress?: NonNullable<
    ConstructorParameters<typeof GooglePlacesProspectAdapter>[0]
  >['onProgress']
}): ProspectSourceAdapter[] {
  const wanted = new Set(
    input?.sources ??
      (['google_places', 'osm', 'brave_web', 'gov_pest_control'] as DiscoveryAutoSource[]),
  )
  const adapters: ProspectSourceAdapter[] = []
  const budget = input?.totalBudget ?? getDiscoveryTotalBudget()
  const categorySlugs = input?.categorySlugs ?? getRecruitCategorySlugs()
  const common = {
    categorySlugs,
    city: input?.city ?? getDiscoveryCity(),
    totalBudget: budget,
    apiCallBudget: input?.apiCallBudget ?? getDiscoveryApiCallBudget(),
    perCategoryLimit: Math.min(
      Math.ceil(budget / Math.max(1, categorySlugs.length)),
      getDiscoveryPerCategoryCap(),
    ),
    queryStats: input?.queryStats,
  }

  if (wanted.has('google_places')) {
    if (process.env.GOOGLE_PLACES_API_KEY?.trim()) {
      adapters.push(
        new GooglePlacesProspectAdapter({
          ...common,
          onProgress: input?.onPlacesProgress,
        }),
      )
    }
  }
  if (wanted.has('osm')) {
    adapters.push(new OsmOverpassProspectAdapter(common))
  }
  if (wanted.has('brave_web')) {
    if (process.env.BRAVE_SEARCH_API_KEY?.trim()) {
      adapters.push(
        new BraveWebProspectAdapter({
          categorySlugs,
          city: common.city,
          callBudget: getDiscoveryBraveCallBudget(),
        }),
      )
    }
  }
  if (wanted.has('gov_pest_control')) {
    // Only when pest_control is in recruit categories (or explicitly requested alone)
    if (
      categorySlugs.includes('pest_control') ||
      input?.sources?.includes('gov_pest_control')
    ) {
      adapters.push(
        new GovPestControlProspectAdapter({
          city: common.city,
        }),
      )
    }
  }

  return adapters
}

async function writeRunProgress(
  admin: SupabaseClient,
  runId: string | null,
  progress: DiscoveryProgress,
) {
  if (!runId) return
  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)))
  const { data: current } = await admin
    .from('prospect_discovery_runs')
    .select('details')
    .eq('id', runId)
    .eq('status', 'running')
    .maybeSingle()
  const prevDetails =
    current?.details && typeof current.details === 'object'
      ? (current.details as Record<string, unknown>)
      : {}
  await admin
    .from('prospect_discovery_runs')
    .update({
      details: {
        ...prevDetails,
        progress: { ...progress, percent },
      },
    })
    .eq('id', runId)
    .eq('status', 'running')
}

export async function runProspectDiscovery(
  admin: SupabaseClient,
  options: {
    trigger: DiscoveryTrigger
    actorUserId?: string | null
    sources?: DiscoveryAutoSource[]
    categorySlugs?: string[]
    city?: string
    /** Default false: cumulative merge. Opt-in wipe only. */
    replacePrevious?: boolean
  },
): Promise<DiscoveryRunResult> {
  const city = options.city ?? getDiscoveryCity()
  const budget = getDiscoveryTotalBudget()
  const apiCallBudget = getDiscoveryApiCallBudget()
  const replacePrevious = options.replacePrevious === true

  if (await hasRunningDiscovery(admin)) {
    return {
      runId: null,
      status: 'busy',
      city,
      sources: [],
      found: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 1,
      deletedPrevious: 0,
      budget,
      apiCallBudget,
      errorMessage: 'ריצת גילוי כבר פעילה — נסו שוב בעוד כמה דקות',
      bySource: {},
    }
  }

  const queryStats = await loadQueryStats(admin, city).catch(() => [])

  let lastProgressWrite = 0
  const reportProgress = async (progress: DiscoveryProgress) => {
    const now = Date.now()
    // Throttle DB writes (~700ms) except for terminal-ish jumps
    if (
      progress.percent < 99 &&
      now - lastProgressWrite < 700 &&
      progress.phase === 'places'
    ) {
      return
    }
    lastProgressWrite = now
    await writeRunProgress(admin, runId, progress).catch(() => {})
  }

  // runId assigned below — placeholder; reassigned after insert
  let runId: string | null = null

  const adapters = buildAdapters({
    sources: options.sources,
    categorySlugs: options.categorySlugs,
    city,
    totalBudget: budget,
    apiCallBudget,
    queryStats,
    onPlacesProgress: async (p) => {
      const jobRatio =
        p.jobsTotal > 0 ? p.jobsDone / p.jobsTotal : p.searchCalls / Math.max(1, p.apiCallBudget)
      const callRatio = p.searchCalls / Math.max(1, p.apiCallBudget)
      const ratio = Math.min(1, Math.max(jobRatio, callRatio * 0.85))
      await reportProgress({
        percent: 8 + ratio * 67,
        phase: 'places',
        labelHe: `סורק Google Places… ${Math.round(ratio * 100)}%`,
        apiCalls: p.searchCalls,
        apiCallBudget: p.apiCallBudget,
        jobsDone: p.jobsDone,
        jobsTotal: p.jobsTotal,
      })
    },
  })

  const sourceNames = adapters.map((a) => a.name)
  let deletedPrevious = 0

  const { data: runRow } = await admin
    .from('prospect_discovery_runs')
    .insert({
      trigger: options.trigger,
      sources: sourceNames,
      city,
      status: 'running',
      actor_user_id: options.actorUserId ?? null,
      details: {
        progress: {
          percent: 2,
          phase: 'starting',
          labelHe: 'מתחיל גילוי…',
          apiCallBudget,
        } satisfies DiscoveryProgress,
      },
    })
    .select('id')
    .maybeSingle()

  runId = runRow?.id ?? null

  const bySource: DiscoveryRunResult['bySource'] = {}
  let found = 0
  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0
  const topErrors: string[] = []
  let stopReason: string | null = null
  let totalApiCalls = 0
  const queryYields: Array<Record<string, unknown>> = []

  if (adapters.length === 0) {
    const msg =
      'אין מקורות זמינים — הגדר GOOGLE_PLACES_API_KEY / BRAVE_SEARCH_API_KEY או הפעל OSM / מאגר מדבירים'
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
      updated: 0,
      skipped: 0,
      errors: 1,
      deletedPrevious: 0,
      budget,
      apiCallBudget,
      errorMessage: msg,
      bySource,
    }
  }

  try {
    if (replacePrevious) {
      await reportProgress({
        percent: 5,
        phase: 'starting',
        labelHe: 'מנקה לידים ישנים…',
        apiCallBudget,
      })
      const cleared = await clearReplaceableAutoProspects(admin)
      deletedPrevious = cleared.deleted
    }

    await reportProgress({
      percent: 8,
      phase: 'places',
      labelHe: 'מתחיל סריקת Places…',
      apiCallBudget,
    })

    for (const adapter of adapters) {
      bySource[adapter.name] = {
        found: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      }
      try {
        if (adapter.name === 'osm') {
          await reportProgress({
            percent: 62,
            phase: 'osm',
            labelHe: 'סורק OpenStreetMap…',
            apiCallBudget,
            apiCalls: totalApiCalls,
          })
        } else if (adapter.name === 'brave_web') {
          await reportProgress({
            percent: 72,
            phase: 'brave',
            labelHe: 'מחפש אתרים ב־Brave…',
            apiCallBudget,
            apiCalls: totalApiCalls,
          })
        } else if (adapter.name === 'gov_pest_control') {
          await reportProgress({
            percent: 82,
            phase: 'gov',
            labelHe: 'טוען מאגר מדבירים מורשים…',
            apiCallBudget,
            apiCalls: totalApiCalls,
          })
        }

        const records = await adapter.fetchRecords()
        records.sort((a, b) => {
          const sa =
            a.fitScore ??
            assessProspectFit({
              name: a.name,
              businessName: a.businessName,
              phone: a.phone,
            }).score
          const sb =
            b.fitScore ??
            assessProspectFit({
              name: b.name,
              businessName: b.businessName,
              phone: b.phone,
            }).score
          return sb - sa
        })
        bySource[adapter.name].found = records.length
        found += records.length

        if (adapter instanceof GooglePlacesProspectAdapter) {
          const s = adapter.lastStats
          totalApiCalls += s.searchCalls
          stopReason = stopReason ?? s.stopReason
          bySource[adapter.name].stats = {
            rawFetched: s.rawFetched,
            uniquePlaces: s.uniquePlaces,
            rejectedNoPhone: s.rejectedNoPhone,
            rejectedFilter: s.rejectedFilter,
            kept: s.kept,
            suitable: s.suitable,
            needsReview: s.needsReview,
            searchCalls: s.searchCalls,
            stopReason: s.stopReason,
          }
          queryYields.push(...s.queryYields)
          if (s.searchErrors.length > 0) {
            bySource[adapter.name].errors.push(...s.searchErrors.slice(0, 5))
            errors += s.searchErrors.length
            topErrors.push(
              ...s.searchErrors.slice(0, 3).map((e) => `google_places: ${e}`),
            )
          }
          await upsertQueryStats(admin, s.queryYields).catch(() => {})
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
        if (adapter instanceof BraveWebProspectAdapter) {
          const s = adapter.lastStats
          bySource[adapter.name].stats = {
            searchCalls: s.searchCalls,
            callBudget: s.callBudget,
            urlsConsidered: s.urlsConsidered,
            sitesFetched: s.sitesFetched,
            kept: s.kept,
            stopReason: s.stopReason,
          }
          if (s.searchErrors.length > 0) {
            bySource[adapter.name].errors.push(...s.searchErrors.slice(0, 5))
            errors += s.searchErrors.length
            topErrors.push(
              ...s.searchErrors.slice(0, 3).map((e) => `brave_web: ${e}`),
            )
          }
        }
        if (adapter instanceof GovPestControlProspectAdapter) {
          bySource[adapter.name].stats = {
            fetched: adapter.lastFetched,
            kept: adapter.lastKept,
          }
          if (adapter.lastErrors.length > 0) {
            bySource[adapter.name].errors.push(...adapter.lastErrors.slice(0, 5))
          }
        }

        const wrap: ProspectSourceAdapter = {
          name: adapter.name,
          fetchRecords: async () => records,
        }
        await reportProgress({
          percent:
            adapter.name === 'gov_pest_control'
              ? 90
              : adapter.name === 'brave_web'
                ? 85
                : adapter.name === 'osm'
                  ? 70
                  : 55,
          phase: 'ingest',
          labelHe: `שומר לידים מ־${adapter.name}…`,
          apiCallBudget,
          apiCalls: totalApiCalls,
        })
        const result: IngestResult = await ingestFromAdapter(
          admin,
          wrap,
          options.actorUserId,
        )
        bySource[adapter.name].created = result.created.length
        bySource[adapter.name].updated = result.updated.length
        bySource[adapter.name].skipped = result.skipped.length
        // Contribution: newly created = unique-to-this-source this run;
        // updated = merged into an existing row from another/prior source.
        bySource[adapter.name].uniqueToSource = result.created.length
        bySource[adapter.name].mergedIntoExisting = result.updated.length
        bySource[adapter.name].errors.push(
          ...result.errors.map((e) => e.error),
        )
        created += result.created.length
        updated += result.updated.length
        skipped += result.skipped.length
        errors += result.errors.length
        topErrors.push(
          ...result.errors.map((e) => `${adapter.name}: ${e.error}`),
        )

        // Sightings (best-effort)
        if (runId) {
          const sightingRows = [
            ...result.created.map((p) => ({
              run_id: runId,
              prospect_id: p.id,
              source_name: adapter.name,
              external_id: p.externalId,
              outcome: 'kept',
              fit_class: p.fitClass,
              reason: 'created',
            })),
            ...result.updated.map((p) => ({
              run_id: runId,
              prospect_id: p.id,
              source_name: adapter.name,
              external_id: p.externalId,
              outcome: 'updated',
              fit_class: p.fitClass,
              reason: 'merged',
            })),
            ...result.skipped.slice(0, 50).map((s) => ({
              run_id: runId,
              prospect_id: s.existingId ?? null,
              source_name: adapter.name,
              outcome: s.reason.startsWith('protected_')
                ? 'duplicate'
                : 'duplicate',
              reason: s.reason,
            })),
          ]
          if (sightingRows.length > 0) {
            try {
              await admin.from('prospect_discovery_sightings').insert(sightingRows)
            } catch {
              /* best-effort */
            }
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'source failed'
        bySource[adapter.name].errors.push(message)
        errors += 1
        topErrors.push(`${adapter.name}: ${message}`)
      }
    }

    const details = {
      bySource,
      deletedPrevious,
      budget,
      apiCallBudget,
      apiCalls: totalApiCalls,
      stopReason,
      created,
      updated,
      skipped,
      queryYields: queryYields.slice(0, 40),
      allErrors: topErrors.slice(0, 12),
      replacePrevious,
      progress: {
        percent: 100,
        phase: 'done' as const,
        labelHe: 'הגילוי הסתיים',
        apiCalls: totalApiCalls,
        apiCallBudget,
      },
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
          details,
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
      updated,
      skipped,
      errors,
      deletedPrevious,
      budget,
      apiCallBudget,
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
            apiCallBudget,
            apiCalls: totalApiCalls,
            updated,
            allErrors: [...topErrors, message].slice(0, 12),
            replacePrevious,
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
      updated,
      skipped,
      errors: errors + 1,
      deletedPrevious,
      budget,
      apiCallBudget,
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
