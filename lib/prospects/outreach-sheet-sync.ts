import type { SupabaseClient } from '@supabase/supabase-js'
import { assessProspectFit } from '@/lib/prospects/fit-score'
import {
  readOutreachGrid,
  sheetsWriteConfigured,
  writeOutreachCells,
  type SheetCellWrite,
} from '@/lib/integrations/google-sheets'
import { normalizePhone } from '@/lib/prospects/phone'
import {
  OUTREACH_SOURCE,
  contentHash,
  leadContentHash,
  parseOutreachGrid,
  planOutreachSync,
  prospectStatusToSheet,
  readOutreachLink,
  type ExistingOutreachProspect,
  type OutreachUpdate,
  type SheetLead,
} from '@/lib/prospects/outreach-sheet'
import type { ProspectStatus } from '@/lib/prospects/types'

const SHEET_URL = `https://docs.google.com/spreadsheets/d/1t8GFErh_jtxdPLezvg9lUjF922LkZkXWKPlMCLuNc_4/edit`

type ProspectRow = {
  id: string
  name: string
  phone: string | null
  phone_normalized: string | null
  city: string
  status: ProspectStatus
  notes: string | null
  services: string[] | null
  waitlist_id: string | null
  enrichment: unknown
}

export type OutreachSyncResult = {
  created: number
  updated: number
  skipped: number
  duplicates: number
  registered: number
  uncertain: number
  wroteSheet: boolean
  configured: boolean
  message: string
  errors: string[]
}

async function loadAll<T>(
  admin: SupabaseClient,
  table: string,
  columns: string,
): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin
      .from(table)
      .select(columns)
      .order('id')
      .range(offset, offset + 499)
    if (error) throw new Error(error.message)
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < 500) break
  }
  return rows
}

function linkPayload(lead: SheetLead, status: ProspectStatus, notes: string | null, services: string[], name: string, city: string, phone: string | null, pendingPush: boolean) {
  const sheetHash = leadContentHash(lead)
  const dbHash = contentHash({
    region: city,
    name,
    phoneNormalized: normalizePhone(phone),
    trades: services.join('; '),
    statusLabel: lead.statusRecognized ? prospectStatusToSheet(status) : lead.statusLabel,
    notes: notes ?? '',
  })
  return { sheetHash, dbHash, pendingPush, row: lead.row }
}

function enrichmentWithLink(
  current: unknown,
  link: ReturnType<typeof linkPayload>,
): Record<string, unknown> {
  const base =
    current && typeof current === 'object' ? { ...(current as Record<string, unknown>) } : {}
  return {
    ...base,
    outreachSheet: {
      row: link.row,
      sheetHash: link.sheetHash,
      dbHash: link.dbHash,
      pendingPush: link.pendingPush,
      syncedAt: new Date().toISOString(),
    },
  }
}

function actorId(actorUserId?: string | null): string | null {
  return actorUserId && /^[0-9a-f-]{36}$/i.test(actorUserId) ? actorUserId : null
}

export async function syncOutreachSheet(admin: SupabaseClient, actorUserId?: string | null): Promise<OutreachSyncResult> {
  const grid = await readOutreachGrid()
  const leads = parseOutreachGrid(grid)
  const [prospects, waitlist] = await Promise.all([
    loadAll<ProspectRow>(
      admin,
      'professional_prospects',
      'id, name, phone, phone_normalized, city, status, notes, services, waitlist_id, enrichment',
    ),
    loadAll<{ phone: string | null }>(admin, 'pro_waitlist', 'id, phone'),
  ])
  const existing: ExistingOutreachProspect[] = prospects.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    phoneNormalized: row.phone_normalized,
    city: row.city,
    status: row.status,
    notes: row.notes,
    services: row.services ?? [],
    waitlistId: row.waitlist_id,
    link: readOutreachLink(row.enrichment),
  }))
  const plan = planOutreachSync(
    leads,
    existing,
    waitlist.map((row) => row.phone ?? ''),
  )
  const errors: string[] = []
  const writes: SheetCellWrite[] = []
  let created = 0
  let updated = 0
  const categories = await loadCategories(admin)
  const actor = actorId(actorUserId)

  for (const lead of plan.creates) {
    try {
      const id = await insertLead(admin, lead, categories, actor)
      created++
      writes.push({ row: lead.row, column: 'H', value: id })
    } catch (error) {
      errors.push(`${lead.name}: ${error instanceof Error ? error.message : 'יצירה נכשלה'}`)
    }
  }

  for (const change of plan.updates) {
    try {
      const changed = await applyUpdate(admin, change, actor)
      if (changed) updated++
      writes.push(...cellsFor(change))
    } catch (error) {
      errors.push(`${change.name}: ${error instanceof Error ? error.message : 'עדכון נכשל'}`)
    }
  }

  let wroteSheet = false
  if (writes.length && sheetsWriteConfigured()) {
    wroteSheet = await writeOutreachCells(writes)
    if (wroteSheet) await clearPendingPush(admin, writes.map((write) => write.row))
  }

  const duplicates = plan.skips.filter((skip) => skip.reason === 'כפילות בגיליון').length
  const registered = plan.skips.filter((skip) => skip.reason === 'כבר נרשם').length
  const uncertain = plan.skips.filter((skip) => skip.reason.includes('לא ודאי')).length
  const pending = writes.length > 0 && !wroteSheet
  const message = [
    `נוספו ${created}`,
    `עודכנו ${updated}`,
    `דולגו ${plan.skips.length}`,
    duplicates ? `כפילויות בגיליון ${duplicates}` : '',
    registered ? `כבר נרשמו ${registered}` : '',
    uncertain ? `מספר לא ודאי שכבר קיים ${uncertain}` : '',
    pending
      ? 'הכתיבה חזרה לגיליון ממתינה לשיתוף הגיליון עם חשבון Google'
      : wroteSheet
        ? 'הגיליון עודכן'
        : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    created,
    updated,
    skipped: plan.skips.length,
    duplicates,
    registered,
    uncertain,
    wroteSheet,
    configured: sheetsWriteConfigured(),
    message,
    errors,
  }
}

function cellsFor(change: OutreachUpdate): SheetCellWrite[] {
  const writes: SheetCellWrite[] = []
  if (change.pushId) writes.push({ row: change.lead.row, column: 'H', value: change.id })
  if (change.pushFields) {
    writes.push(
      { row: change.lead.row, column: 'A', value: change.city },
      { row: change.lead.row, column: 'B', value: change.name },
      { row: change.lead.row, column: 'C', value: change.phone ?? '' },
      { row: change.lead.row, column: 'D', value: change.services.join('; ') },
      { row: change.lead.row, column: 'F', value: prospectStatusToSheet(change.status) },
      { row: change.lead.row, column: 'G', value: change.notes ?? '' },
    )
  } else if (change.pushStatus) {
    writes.push({
      row: change.lead.row,
      column: 'F',
      value: prospectStatusToSheet(change.status),
    })
  }
  return writes
}

async function loadCategories(admin: SupabaseClient): Promise<Map<string, string>> {
  const { data } = await admin.from('service_categories').select('id, slug')
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    if (row.slug) map.set(row.slug, row.id)
  }
  return map
}

async function insertLead(
  admin: SupabaseClient,
  lead: SheetLead,
  categories: Map<string, string>,
  actorUserId: string | null,
): Promise<string> {
  const status = lead.status ?? 'discovered'
  const fit = assessProspectFit({
    name: lead.name,
    businessName: lead.name,
    phone: lead.phone,
  })
  const link = linkPayload(lead, status, lead.notes || null, lead.services, lead.name, lead.region, lead.phone, true)
  const now = new Date().toISOString()
  const payload = {
    name: lead.name,
    business_name: null,
    phone: lead.phone,
    whatsapp_phone: fit.contactability === 'mobile' ? lead.phone : null,
    phone_normalized: lead.phoneNormalized,
    city: lead.region,
    search_city: lead.region,
    category_id: lead.categorySlug ? categories.get(lead.categorySlug) ?? null : null,
    source_name: OUTREACH_SOURCE,
    source_url: SHEET_URL,
    external_id: lead.phoneNormalized,
    status,
    verification_status: 'unverified',
    contacted_at: status === 'contacted' || status === 'interested' ? now : null,
    notes: lead.notes || null,
    services: lead.services,
    service_areas: lead.region ? [lead.region] : [],
    fit_score: fit.score,
    fit_class: fit.fitClass,
    fit_confidence: fit.confidence,
    fit_reasons: fit.reasons,
    contactability: fit.contactability,
    source_refs: [
      {
        source: OUTREACH_SOURCE,
        externalId: lead.phoneNormalized,
        url: SHEET_URL,
        seenAt: now,
      },
    ],
    enrichment: enrichmentWithLink(null, link),
    last_seen_at: now,
    created_by: actorUserId,
    updated_by: actorUserId,
  }
  const inserted = await admin
    .from('professional_prospects')
    .insert(payload)
    .select('id')
    .single()
  if (inserted.error || !inserted.data) {
    if (inserted.error?.code === '23505') {
      throw new Error('כפילות לפי טלפון')
    }
    throw new Error(inserted.error?.message ?? 'יצירה נכשלה')
  }
  const id = inserted.data.id as string
  const categoryId = payload.category_id
  if (categoryId) {
    await admin.from('professional_prospect_categories').upsert(
      { prospect_id: id, category_id: categoryId, source: OUTREACH_SOURCE },
      { onConflict: 'prospect_id,category_id', ignoreDuplicates: true },
    )
  }
  await admin.from('professional_prospect_events').insert({
    prospect_id: id,
    actor_user_id: actorUserId,
    action: 'outreach_sheet_created',
    from_status: null,
    to_status: status,
    payload: { row: lead.row },
  })
  return id
}

async function applyUpdate(
  admin: SupabaseClient,
  change: OutreachUpdate,
  actorUserId: string | null,
): Promise<boolean> {
  const { data: current, error } = await admin
    .from('professional_prospects')
    .select('enrichment, status, name, city, phone, notes, services')
    .eq('id', change.id)
    .maybeSingle()
  if (error || !current) throw new Error(error?.message ?? 'הליד לא נמצא')
  const same =
    current.name === change.name &&
    current.city === change.city &&
    current.phone === change.phone &&
    current.status === change.status &&
    (current.notes ?? null) === (change.notes ?? null) &&
    JSON.stringify(current.services ?? []) === JSON.stringify(change.services)
  const link = readOutreachLink(current.enrichment)
  if (same && link?.pendingPush) return false
  const pendingPush = change.pushId || change.pushFields || change.pushStatus
  const nextLink = linkPayload(
    change.lead,
    change.status,
    change.notes,
    change.services,
    change.name,
    change.city,
    change.phone,
    pendingPush,
  )
  const patch: Record<string, unknown> = {
    name: change.name,
    city: change.city,
    phone: change.phone,
    phone_normalized: normalizePhone(change.phone),
    status: change.status,
    notes: change.notes,
    services: change.services,
    enrichment: enrichmentWithLink(current.enrichment, nextLink),
    updated_by: actorUserId,
    last_seen_at: new Date().toISOString(),
  }
  if (
    (change.status === 'contacted' || change.status === 'interested') &&
    current.status !== change.status
  ) {
    patch.contacted_at = new Date().toISOString()
  }
  const updated = await admin.from('professional_prospects').update(patch).eq('id', change.id)
  if (updated.error) throw new Error(updated.error.message)
  if (current.status !== change.status) {
    await admin.from('professional_prospect_events').insert({
      prospect_id: change.id,
      actor_user_id: actorUserId,
      action: 'outreach_sheet_status',
      from_status: current.status,
      to_status: change.status,
      payload: { row: change.lead.row },
    })
  }
  return !same
}

async function clearPendingPush(admin: SupabaseClient, rows: number[]) {
  const unique = [...new Set(rows)]
  const prospects = await loadAll<ProspectRow>(
    admin,
    'professional_prospects',
    'id, enrichment',
  )
  for (const prospect of prospects) {
    const link = readOutreachLink(prospect.enrichment)
    if (!link || !unique.includes(link.row) || !link.pendingPush) continue
    const enrichment = enrichmentWithLink(prospect.enrichment, { ...link, pendingPush: false })
    await admin.from('professional_prospects').update({ enrichment }).eq('id', prospect.id)
  }
}
