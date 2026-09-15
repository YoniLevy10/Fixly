import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import { GooglePlacesProspectAdapter } from '@/lib/prospects/adapters/google-places'
import { OsmOverpassProspectAdapter } from '@/lib/prospects/adapters/osm-overpass'
import { GovPestControlProspectAdapter } from '@/lib/prospects/adapters/gov-pest-control'
import {
  clearReplaceableAutoProspects,
  ingestFromAdapter,
  type IngestResult,
} from '@/lib/prospects/service'
import { getDiscoveryCity } from '@/lib/prospects/discovery-mapping'
import {
  getDiscoveryApiCallBudget,
  getDiscoveryChunkMaxJobs,
  getDiscoveryFinalizeBufferMs,
  getDiscoveryPerCategoryCap,
  getDiscoveryTotalBudget,
  getDiscoveryWallClockMs,
  getRecruitCategorySlugs,
} from '@/lib/prospects/config'
import { assessProspectFit } from '@/lib/prospects/fit-score'
import {
  forceUnlockDiscoveryRuns,
  hasRunningDiscovery,
  loadQueryStats,
  releaseStaleDiscoveryRuns,
  upsertQueryStats,
} from '@/lib/prospects/query-stats-store'

export type DiscoveryTrigger = 'cron' | 'manual'

export type DiscoveryAutoSource =
  | 'google_places'
  | 'osm'
  | 'gov_pest_control'

export type DiscoveryRunResult = {
  runId: string | null
  /** `continue` = more chunks remain — client should POST again with continueRunId */
  status: 'completed' | 'failed' | 'busy' | 'continue'
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
  continueRunId?: string | null
  chunk?: {
    phase: string
    placesJobOffset: number
    placesJobsTotal: number
  }
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

type DiscoveryCursor = {
  phase: 'places' | 'osm' | 'gov' | 'done'
  placesJobOffset: number
  placesJobsTotal: number
  sourcesWanted: DiscoveryAutoSource[]
  cumulative: {
    found: number
    created: number
    updated: number
    skipped: number
    errors: number
    apiCalls: number
  }
}

type RunDetails = Record<string, unknown> & {
  cursor?: DiscoveryCursor
  heartbeatAt?: string
  progress?: DiscoveryProgress
  bySource?: DiscoveryRunResult['bySource']
  allErrors?: string[]
  deletedPrevious?: number
  budget?: number
  apiCallBudget?: number
  replacePrevious?: boolean
  stopReason?: string | null
}

function unknownErrorMessage(e: unknown, fallback = 'source failed'): string {
  if (e instanceof Error && e.message.trim()) return e.message
  if (e && typeof e === 'object' && 'message' in e) {
    const msg = (e as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  if (typeof e === 'string' && e.trim()) return e
  return fallback
}

function emptyCumulative(): DiscoveryCursor['cumulative'] {
  return { found: 0, created: 0, updated: 0, skipped: 0, errors: 0, apiCalls: 0 }
}

function initialCursor(sources: DiscoveryAutoSource[]): DiscoveryCursor {
  const wanted = sources.length
    ? sources
    : (['google_places', 'osm', 'gov_pest_control'] as DiscoveryAutoSource[])
  const phase: DiscoveryCursor['phase'] = wanted.includes('google_places')
    ? 'places'
    : wanted.includes('osm')
      ? 'osm'
      : wanted.includes('gov_pest_control')
        ? 'gov'
        : 'done'
  return {
    phase,
    placesJobOffset: 0,
    placesJobsTotal: 0,
    sourcesWanted: wanted,
    cumulative: emptyCumulative(),
  }
}

function nextPhaseAfter(
  cursor: DiscoveryCursor,
): DiscoveryCursor['phase'] {
  const wanted = new Set(cursor.sourcesWanted)
  if (cursor.phase === 'places') {
    if (wanted.has('osm')) return 'osm'
    if (wanted.has('gov_pest_control')) return 'gov'
    return 'done'
  }
  if (cursor.phase === 'osm') {
    if (wanted.has('gov_pest_control')) return 'gov'
    return 'done'
  }
  return 'done'
}

async function writeRunProgress(
  admin: SupabaseClient,
  runId: string | null,
  progress: DiscoveryProgress,
  patch?: Partial<RunDetails>,
) {
  if (!runId) return
  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)))
  const heartbeatAt = new Date().toISOString()
  const { data: current } = await admin
    .from('prospect_discovery_runs')
    .select('details')
    .eq('id', runId)
    .eq('status', 'running')
    .maybeSingle()
  const prevDetails =
    current?.details && typeof current.details === 'object'
      ? (current.details as RunDetails)
      : {}
  await admin
    .from('prospect_discovery_runs')
    .update({
      details: {
        ...prevDetails,
        ...patch,
        heartbeatAt,
        progress: { ...progress, percent },
      },
    })
    .eq('id', runId)
    .eq('status', 'running')
}

/**
 * Process ONE discovery chunk (Places slice / OSM / gov).
 * Client should loop while status === 'continue'.
 */
export async function runProspectDiscovery(
  admin: SupabaseClient,
  options: {
    trigger: DiscoveryTrigger
    actorUserId?: string | null
    sources?: DiscoveryAutoSource[]
    categorySlugs?: string[]
    city?: string
    replacePrevious?: boolean
    /** Continue an in-progress chunked run */
    continueRunId?: string | null
  },
): Promise<DiscoveryRunResult> {
  const city = options.city ?? getDiscoveryCity()
  const budget = getDiscoveryTotalBudget()
  const apiCallBudget = getDiscoveryApiCallBudget()
  const chunkMaxJobs = getDiscoveryChunkMaxJobs()
  const replacePrevious = options.replacePrevious === true
  const hardDeadlineAt = Date.now() + getDiscoveryWallClockMs()
  const placesDeadlineAt = hardDeadlineAt - getDiscoveryFinalizeBufferMs()
  const categorySlugs = options.categorySlugs ?? getRecruitCategorySlugs()

  await releaseStaleDiscoveryRuns(admin).catch(() => 0)

  let runId: string | null = options.continueRunId?.trim() || null
  let cursor: DiscoveryCursor
  let details: RunDetails = {}
  let deletedPrevious = 0
  const bySource: DiscoveryRunResult['bySource'] = {}
  const topErrors: string[] = []

  if (runId) {
    const { data: existing, error } = await admin
      .from('prospect_discovery_runs')
      .select('*')
      .eq('id', runId)
      .maybeSingle()
    if (error || !existing) {
      return {
        runId: null,
        status: 'failed',
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
        errorMessage: 'ריצת המשך לא נמצאה — התחילו גילוי מחדש',
        bySource: {},
      }
    }
    if (existing.status !== 'running') {
      return {
        runId,
        status: existing.status === 'completed' ? 'completed' : 'failed',
        city: existing.city ?? city,
        sources: (existing.sources as string[]) ?? [],
        found: existing.found_count ?? 0,
        created: existing.created_count ?? 0,
        updated: 0,
        skipped: existing.skipped_count ?? 0,
        errors: existing.error_count ?? 0,
        deletedPrevious: 0,
        budget,
        apiCallBudget,
        errorMessage: existing.error_message ?? undefined,
        bySource: {},
      }
    }
    details =
      existing.details && typeof existing.details === 'object'
        ? (existing.details as RunDetails)
        : {}
    cursor = details.cursor ?? initialCursor(options.sources ?? [])
    deletedPrevious = Number(details.deletedPrevious ?? 0)
    if (details.bySource && typeof details.bySource === 'object') {
      Object.assign(bySource, details.bySource)
    }
  } else {
    if (await hasRunningDiscovery(admin)) {
      const unlocked = await releaseStaleDiscoveryRuns(admin).catch(() => 0)
      if (!unlocked || (await hasRunningDiscovery(admin))) {
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
          errorMessage:
            'ריצת גילוי כבר פעילה — לחצו «שחרר נעילה» אם היא תקועה',
          bySource: {},
        }
      }
    }

    cursor = initialCursor(options.sources ?? [])
    const sourceNames = cursor.sourcesWanted.filter((s) => {
      if (s === 'google_places') return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim())
      return true
    })

    if (sourceNames.length === 0) {
      return {
        runId: null,
        status: 'failed',
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
        errorMessage:
          'אין מקורות זמינים — הגדר GOOGLE_PLACES_API_KEY או הפעל OSM / מאגר מדבירים',
        bySource: {},
      }
    }

    if (replacePrevious) {
      const cleared = await clearReplaceableAutoProspects(admin)
      deletedPrevious = cleared.deleted
    }

    const { data: runRow } = await admin
      .from('prospect_discovery_runs')
      .insert({
        trigger: options.trigger,
        sources: sourceNames,
        city,
        status: 'running',
        actor_user_id: options.actorUserId ?? null,
        details: {
          heartbeatAt: new Date().toISOString(),
          cursor,
          deletedPrevious,
          budget,
          apiCallBudget,
          replacePrevious,
          bySource: {},
          allErrors: [],
          progress: {
            percent: 2,
            phase: 'starting',
            labelHe: 'מתחיל גילוי מחולק…',
            apiCallBudget,
          } satisfies DiscoveryProgress,
        } satisfies RunDetails,
      })
      .select('id')
      .maybeSingle()

    runId = runRow?.id ?? null
    if (!runId) {
      return {
        runId: null,
        status: 'failed',
        city,
        sources: sourceNames,
        found: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 1,
        deletedPrevious,
        budget,
        apiCallBudget,
        errorMessage: 'יצירת ריצת גילוי נכשלה',
        bySource: {},
      }
    }
  }

  const queryStats = await loadQueryStats(admin, city).catch(() => [])
  let chunkFound = 0
  let chunkCreated = 0
  let chunkUpdated = 0
  let chunkSkipped = 0
  let chunkErrors = 0
  let stopReason: string | null = null

  try {
    await writeRunProgress(
      admin,
      runId,
      {
        percent: Math.min(95, 5 + cursor.placesJobOffset / Math.max(1, cursor.placesJobsTotal || 40) * 70),
        phase: cursor.phase === 'done' ? 'done' : cursor.phase,
        labelHe:
          cursor.phase === 'places'
            ? `סורק Places (צ׳אנק)… משרה ${cursor.placesJobOffset}`
            : cursor.phase === 'osm'
              ? 'סורק OpenStreetMap…'
              : cursor.phase === 'gov'
                ? 'טוען מאגר מדבירים…'
                : 'מסיים…',
        apiCallBudget,
        apiCalls: cursor.cumulative.apiCalls,
        jobsDone: cursor.placesJobOffset,
        jobsTotal: cursor.placesJobsTotal || undefined,
      },
      { cursor },
    )

    if (cursor.phase === 'places' && cursor.sourcesWanted.includes('google_places')) {
      if (!process.env.GOOGLE_PLACES_API_KEY?.trim()) {
        cursor.phase = nextPhaseAfter(cursor)
      } else {
        const adapter = new GooglePlacesProspectAdapter({
          categorySlugs,
          city,
          totalBudget: budget,
          apiCallBudget,
          perCategoryLimit: Math.min(
            Math.ceil(budget / Math.max(1, categorySlugs.length)),
            getDiscoveryPerCategoryCap(),
          ),
          jobOffset: cursor.placesJobOffset,
          maxJobs: chunkMaxJobs,
          queryStats,
          deadlineAt: placesDeadlineAt,
          onProgress: async (p) => {
            await writeRunProgress(admin, runId, {
              percent: 8 + (p.jobsTotal > 0 ? p.jobsDone / p.jobsTotal : 0) * 70,
              phase: 'places',
              labelHe: `סורק Google Places… ${p.jobsDone}/${p.jobsTotal}`,
              apiCalls: cursor.cumulative.apiCalls + p.searchCalls,
              apiCallBudget,
              jobsDone: p.jobsDone,
              jobsTotal: p.jobsTotal,
            })
          },
        })

        const records = await adapter.fetchRecords()
        records.sort((a, b) => {
          const sa =
            a.fitScore ??
            assessProspectFit({ name: a.name, businessName: a.businessName, phone: a.phone })
              .score
          const sb =
            b.fitScore ??
            assessProspectFit({ name: b.name, businessName: b.businessName, phone: b.phone })
              .score
          return sb - sa
        })

        const s = adapter.lastStats
        const prevPlacesFound = bySource.google_places?.found ?? 0
        chunkFound = records.length
        cursor.placesJobsTotal = s.jobsTotal
        cursor.placesJobOffset = s.nextJobOffset
        cursor.cumulative.apiCalls += s.searchCalls
        stopReason = s.stopReason
        bySource.google_places = {
          found: prevPlacesFound + records.length,
          created: bySource.google_places?.created ?? 0,
          updated: bySource.google_places?.updated ?? 0,
          skipped: bySource.google_places?.skipped ?? 0,
          errors: [
            ...(bySource.google_places?.errors ?? []),
            ...s.searchErrors.slice(0, 5),
          ].slice(0, 12),
          stats: {
            rawFetched: s.rawFetched,
            uniquePlaces: s.uniquePlaces,
            rejectedFilter: s.rejectedFilter,
            kept: s.kept,
            suitable: s.suitable,
            needsReview: s.needsReview,
            searchCalls: cursor.cumulative.apiCalls,
            stopReason: s.stopReason,
            jobsTotal: s.jobsTotal,
            jobsOffset: s.jobsOffset,
            nextJobOffset: s.nextJobOffset,
            moreJobs: s.moreJobs ? 1 : 0,
          },
        }
        if (s.searchErrors.length) {
          chunkErrors += s.searchErrors.length
          topErrors.push(...s.searchErrors.slice(0, 3).map((e) => `google_places: ${e}`))
        }
        await upsertQueryStats(admin, s.queryYields).catch(() => {})

        await writeRunProgress(admin, runId, {
          percent: 55,
          phase: 'ingest',
          labelHe: `שומר ${records.length} לידים מ-Places…`,
          apiCalls: cursor.cumulative.apiCalls,
          apiCallBudget,
        })

        // Always ingest what this chunk fetched — never advance past unsaved leads.
        if (records.length > 0) {
          try {
            const wrap: ProspectSourceAdapter = {
              name: 'google_places',
              fetchRecords: async () => records,
            }
            const result: IngestResult = await ingestFromAdapter(
              admin,
              wrap,
              options.actorUserId,
              { enrichWebsites: false },
            )
            chunkCreated = result.created.length
            chunkUpdated = result.updated.length
            chunkSkipped = result.skipped.length
            chunkErrors += result.errors.length
            bySource.google_places.created =
              (bySource.google_places.created ?? 0) + result.created.length
            bySource.google_places.updated =
              (bySource.google_places.updated ?? 0) + result.updated.length
            bySource.google_places.skipped =
              (bySource.google_places.skipped ?? 0) + result.skipped.length
            bySource.google_places.uniqueToSource = bySource.google_places.created
            bySource.google_places.mergedIntoExisting = bySource.google_places.updated
            if (result.errors.length) {
              topErrors.push(
                ...result.errors
                  .slice(0, 3)
                  .map((e) => `google_places: ${e.error}`),
              )
            }
          } catch (e) {
            chunkErrors += 1
            chunkFound = 0
            bySource.google_places.found = prevPlacesFound
            topErrors.push(`google_places: ${unknownErrorMessage(e)}`)
            // Roll back job cursor so the next chunk retries this slice.
            cursor.placesJobOffset = s.jobsOffset
            stopReason = 'ingest_failed'
          }
        }

        if (stopReason !== 'ingest_failed' && !s.moreJobs) {
          cursor.phase = nextPhaseAfter(cursor)
        }
      }
    } else if (cursor.phase === 'osm' && cursor.sourcesWanted.includes('osm')) {
      const adapter = new OsmOverpassProspectAdapter({
        categorySlugs,
        city,
        totalBudget: budget,
        perCategoryLimit: getDiscoveryPerCategoryCap(),
      })
      await writeRunProgress(admin, runId, {
        percent: 78,
        phase: 'osm',
        labelHe: 'סורק OpenStreetMap…',
        apiCalls: cursor.cumulative.apiCalls,
        apiCallBudget,
      })
      const records = await adapter.fetchRecords()
      chunkFound = records.length
      bySource.osm = {
        found: records.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: adapter.lastCategoryErrors.slice(0, 5),
      }
      if (adapter.lastCategoryErrors.length) {
        chunkErrors += adapter.lastCategoryErrors.length
        topErrors.push(
          ...adapter.lastCategoryErrors.slice(0, 3).map((e) => `osm: ${e}`),
        )
      }
      if (records.length > 0) {
        try {
          const result = await ingestFromAdapter(
            admin,
            { name: 'osm', fetchRecords: async () => records },
            options.actorUserId,
            { enrichWebsites: false },
          )
          chunkCreated = result.created.length
          chunkUpdated = result.updated.length
          chunkSkipped = result.skipped.length
          chunkErrors += result.errors.length
          bySource.osm.created = result.created.length
          bySource.osm.updated = result.updated.length
          bySource.osm.skipped = result.skipped.length
          bySource.osm.uniqueToSource = result.created.length
          bySource.osm.mergedIntoExisting = result.updated.length
          if (result.errors.length) {
            topErrors.push(
              ...result.errors.slice(0, 3).map((e) => `osm: ${e.error}`),
            )
          }
        } catch (e) {
          chunkErrors += 1
          topErrors.push(`osm: ${unknownErrorMessage(e)}`)
        }
      }
      cursor.phase = nextPhaseAfter(cursor)
    } else if (
      cursor.phase === 'gov' &&
      cursor.sourcesWanted.includes('gov_pest_control')
    ) {
      const adapter = new GovPestControlProspectAdapter({ city })
      await writeRunProgress(admin, runId, {
        percent: 90,
        phase: 'gov',
        labelHe: 'טוען מאגר מדבירים…',
        apiCalls: cursor.cumulative.apiCalls,
        apiCallBudget,
      })
      const records = await adapter.fetchRecords()
      chunkFound = records.length
      bySource.gov_pest_control = {
        found: records.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: adapter.lastErrors.slice(0, 5),
        stats: { fetched: adapter.lastFetched, kept: adapter.lastKept },
      }
      if (records.length > 0) {
        try {
          const result = await ingestFromAdapter(
            admin,
            { name: 'gov_pest_control', fetchRecords: async () => records },
            options.actorUserId,
            { enrichWebsites: false },
          )
          chunkCreated = result.created.length
          chunkUpdated = result.updated.length
          chunkSkipped = result.skipped.length
          chunkErrors += result.errors.length
          bySource.gov_pest_control.created = result.created.length
          bySource.gov_pest_control.updated = result.updated.length
          bySource.gov_pest_control.skipped = result.skipped.length
          if (result.errors.length) {
            topErrors.push(
              ...result.errors
                .slice(0, 3)
                .map((e) => `gov_pest_control: ${e.error}`),
            )
          }
        } catch (e) {
          chunkErrors += 1
          topErrors.push(`gov_pest_control: ${unknownErrorMessage(e)}`)
        }
      }
      cursor.phase = 'done'
    } else {
      cursor.phase = 'done'
    }

    cursor.cumulative.found += chunkFound
    cursor.cumulative.created += chunkCreated
    cursor.cumulative.updated += chunkUpdated
    cursor.cumulative.skipped += chunkSkipped
    cursor.cumulative.errors += chunkErrors

    const prevErrors = Array.isArray(details.allErrors) ? details.allErrors : []
    const allErrors = [...prevErrors, ...topErrors].slice(0, 20)
    const done = cursor.phase === 'done'

    const progress: DiscoveryProgress = done
      ? {
          percent: 100,
          phase: 'done',
          labelHe: 'הגילוי הסתיים',
          apiCalls: cursor.cumulative.apiCalls,
          apiCallBudget,
        }
      : {
          percent: Math.min(
            95,
            10 +
              (cursor.placesJobsTotal > 0
                ? (cursor.placesJobOffset / cursor.placesJobsTotal) * 70
                : 40),
          ),
          phase: cursor.phase === 'places' ? 'places' : cursor.phase,
          labelHe:
            cursor.phase === 'places'
              ? `המשך גילוי Places… ${cursor.placesJobOffset}/${cursor.placesJobsTotal || '?'}`
              : cursor.phase === 'osm'
                ? 'המשך → OpenStreetMap'
                : 'המשך → מאגר מדבירים',
          apiCalls: cursor.cumulative.apiCalls,
          apiCallBudget,
          jobsDone: cursor.placesJobOffset,
          jobsTotal: cursor.placesJobsTotal || undefined,
        }

    const nextDetails: RunDetails = {
      ...details,
      cursor,
      heartbeatAt: new Date().toISOString(),
      progress,
      bySource,
      deletedPrevious,
      budget,
      apiCallBudget,
      apiCalls: cursor.cumulative.apiCalls,
      stopReason,
      updated: cursor.cumulative.updated,
      allErrors,
      replacePrevious,
      created: cursor.cumulative.created,
      skipped: cursor.cumulative.skipped,
    }

    if (done) {
      await admin
        .from('prospect_discovery_runs')
        .update({
          status: 'completed',
          found_count: cursor.cumulative.found,
          created_count: cursor.cumulative.created,
          skipped_count: cursor.cumulative.skipped,
          error_count: cursor.cumulative.errors,
          error_message: allErrors[0] ?? null,
          details: nextDetails,
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)

      return {
        runId,
        status: 'completed',
        city,
        sources: cursor.sourcesWanted,
        found: cursor.cumulative.found,
        created: cursor.cumulative.created,
        updated: cursor.cumulative.updated,
        skipped: cursor.cumulative.skipped,
        errors: cursor.cumulative.errors,
        deletedPrevious,
        budget,
        apiCallBudget,
        errorMessage: allErrors[0],
        continueRunId: null,
        chunk: {
          phase: 'done',
          placesJobOffset: cursor.placesJobOffset,
          placesJobsTotal: cursor.placesJobsTotal,
        },
        bySource,
      }
    }

    await admin
      .from('prospect_discovery_runs')
      .update({
        status: 'running',
        found_count: cursor.cumulative.found,
        created_count: cursor.cumulative.created,
        skipped_count: cursor.cumulative.skipped,
        error_count: cursor.cumulative.errors,
        error_message: allErrors[0] ?? null,
        details: nextDetails,
      })
      .eq('id', runId)

    return {
      runId,
      status: 'continue',
      city,
      sources: cursor.sourcesWanted,
      found: cursor.cumulative.found,
      created: cursor.cumulative.created,
      updated: cursor.cumulative.updated,
      skipped: cursor.cumulative.skipped,
      errors: cursor.cumulative.errors,
      deletedPrevious,
      budget,
      apiCallBudget,
      continueRunId: runId,
      chunk: {
        phase: cursor.phase,
        placesJobOffset: cursor.placesJobOffset,
        placesJobsTotal: cursor.placesJobsTotal,
      },
      bySource,
    }
  } catch (e) {
    const message = unknownErrorMessage(e, 'discovery failed')
    cursor.cumulative.errors += 1
    if (runId) {
      await admin
        .from('prospect_discovery_runs')
        .update({
          status: 'failed',
          found_count: cursor.cumulative.found + chunkFound,
          created_count: cursor.cumulative.created + chunkCreated,
          skipped_count: cursor.cumulative.skipped + chunkSkipped,
          error_count: cursor.cumulative.errors,
          error_message: message,
          details: {
            ...details,
            cursor,
            bySource,
            deletedPrevious,
            budget,
            apiCallBudget,
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
      sources: cursor.sourcesWanted,
      found: cursor.cumulative.found + chunkFound,
      created: cursor.cumulative.created + chunkCreated,
      updated: cursor.cumulative.updated + chunkUpdated,
      skipped: cursor.cumulative.skipped + chunkSkipped,
      errors: cursor.cumulative.errors,
      deletedPrevious,
      budget,
      apiCallBudget,
      errorMessage: message,
      bySource,
    }
  }
}

export async function listDiscoveryRuns(admin: SupabaseClient, limit = 10) {
  await releaseStaleDiscoveryRuns(admin).catch(() => 0)
  const { data, error } = await admin
    .from('prospect_discovery_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export { forceUnlockDiscoveryRuns, releaseStaleDiscoveryRuns }
