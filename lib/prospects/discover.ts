import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import { GooglePlacesProspectAdapter } from '@/lib/prospects/adapters/google-places'
import { OsmOverpassProspectAdapter } from '@/lib/prospects/adapters/osm-overpass'
import { ingestFromAdapter, type IngestResult } from '@/lib/prospects/service'
import { getDiscoveryCity } from '@/lib/prospects/discovery-mapping'
import { getRecruitCategorySlugs } from '@/lib/prospects/config'

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
  errorMessage?: string
  bySource: Record<
    string,
    { found: number; created: number; skipped: number; errors: string[] }
  >
}

function buildAdapters(input?: {
  sources?: Array<'google_places' | 'osm'>
  categorySlugs?: string[]
  city?: string
}): ProspectSourceAdapter[] {
  const wanted = new Set(input?.sources ?? ['google_places', 'osm'])
  const adapters: ProspectSourceAdapter[] = []
  const common = {
    categorySlugs: input?.categorySlugs ?? getRecruitCategorySlugs(),
    city: input?.city ?? getDiscoveryCity(),
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
  },
): Promise<DiscoveryRunResult> {
  const city = options.city ?? getDiscoveryCity()
  const adapters = buildAdapters({
    sources: options.sources,
    categorySlugs: options.categorySlugs,
    city,
  })

  const sourceNames = adapters.map((a) => a.name)
  let runId: string | null = null

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
      errorMessage: msg,
      bySource,
    }
  }

  try {
    for (const adapter of adapters) {
      bySource[adapter.name] = {
        found: 0,
        created: 0,
        skipped: 0,
        errors: [],
      }
      try {
        const records = await adapter.fetchRecords()
        bySource[adapter.name].found = records.length
        found += records.length

        // Ingest via a one-shot adapter wrapping already-fetched records
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
        bySource[adapter.name].errors = result.errors.map((e) => e.error)
        created += result.created.length
        skipped += result.skipped.length
        errors += result.errors.length
        topErrors.push(...result.errors.map((e) => `${adapter.name}: ${e.error}`))
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
          details: { bySource },
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
          details: { bySource },
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
