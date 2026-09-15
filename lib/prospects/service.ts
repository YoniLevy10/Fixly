import type { SupabaseClient } from '@supabase/supabase-js'
import { assertSourceRecord } from '@/lib/prospects/adapters/types'
import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import {
  candidateFromSourceRecord,
  findDuplicate,
  type ExistingProspectLite,
} from '@/lib/prospects/dedupe'
import { normalizePhone } from '@/lib/prospects/phone'
import {
  assessProspectFit,
  scorePersonFit,
} from '@/lib/prospects/fit-score'
import { assertTransition, isContactAllowed } from '@/lib/prospects/status'
import { buildRecruitWhatsAppMessage } from '@/lib/prospects/message'
import { countMatchingOpenRequests } from '@/lib/prospects/demand'
import { buildWhatsAppLink } from '@/lib/contact/whatsapp-link'
import { serializeProspectsCsv } from '@/lib/prospects/csv'
import {
  getRecruitCategorySlugs,
  getRecruitCity,
  getRecruitPerCategoryTarget,
} from '@/lib/prospects/config'
import { enrichFromWebsite } from '@/lib/prospects/enrich-website'
import {
  mergeSourceRefs,
  normalizeWebsiteHost,
  pickWebsiteUrl,
  preferLicense,
  type ProspectLicense,
  type ProspectSourceRef,
} from '@/lib/prospects/source-refs'
import type {
  Contactability,
  FitClass,
  ProfessionalProspect,
  ProspectCounters,
  ProspectEvent,
  ProspectListFilters,
  ProspectSourceRecord,
  ProspectStatus,
  VerificationStatus,
} from '@/lib/prospects/types'

type CategoryRow = {
  id: string
  slug: string | null
  name: string
  name_he: string | null
}

type ProspectRow = {
  id: string
  name: string
  business_name: string | null
  phone: string | null
  whatsapp_phone: string | null
  phone_normalized: string | null
  city: string
  search_city?: string | null
  business_address?: string | null
  category_id: string | null
  source_name: string
  source_url: string | null
  website_url?: string | null
  external_id: string | null
  status: ProspectStatus
  verification_status: VerificationStatus
  last_verified_at: string | null
  contacted_at: string | null
  consent_at: string | null
  notes: string | null
  fit_score?: number | null
  fit_class?: FitClass | null
  fit_confidence?: number | null
  fit_reasons?: string[] | null
  contactability?: Contactability | null
  service_areas?: string[] | null
  services?: string[] | null
  enrichment?: Record<string, unknown> | null
  source_refs?: unknown
  license?: unknown
  last_seen_at?: string | null
  waitlist_id: string | null
  professional_id: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  service_categories?: CategoryRow | CategoryRow[] | null
}

function categoryRel(row: ProspectRow): CategoryRow | null {
  const rel = row.service_categories
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}

export function mapProspectRow(row: ProspectRow): ProfessionalProspect {
  const cat = categoryRel(row)
  const refs = Array.isArray(row.source_refs)
    ? (row.source_refs as ProspectSourceRef[])
    : []
  const license =
    row.license && typeof row.license === 'object'
      ? (row.license as ProspectLicense)
      : null
  return {
    id: row.id,
    name: row.name,
    businessName: row.business_name,
    phone: row.phone,
    whatsappPhone: row.whatsapp_phone,
    phoneNormalized: row.phone_normalized,
    city: row.city,
    searchCity: row.search_city ?? null,
    businessAddress: row.business_address ?? null,
    categoryId: row.category_id,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    websiteUrl: row.website_url ?? null,
    externalId: row.external_id,
    status: row.status,
    verificationStatus: row.verification_status,
    lastVerifiedAt: row.last_verified_at,
    contactedAt: row.contacted_at,
    consentAt: row.consent_at,
    notes: row.notes,
    fitScore: row.fit_score ?? null,
    fitClass: row.fit_class ?? null,
    fitConfidence: row.fit_confidence ?? null,
    fitReasons: Array.isArray(row.fit_reasons) ? row.fit_reasons : [],
    contactability: row.contactability ?? null,
    serviceAreas: row.service_areas ?? [],
    services: row.services ?? [],
    enrichment: row.enrichment ?? null,
    sourceRefs: refs,
    license,
    lastSeenAt: row.last_seen_at ?? null,
    waitlistId: row.waitlist_id,
    professionalId: row.professional_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryName: cat?.name ?? null,
    categorySlug: cat?.slug ?? null,
    categoryNameHe: cat?.name_he ?? null,
  }
}

/**
 * Disambiguate the direct category FK vs many-to-many junction
 * (`professional_prospect_categories` → `service_categories`).
 * Without the hint PostgREST returns:
 * "Could not embed because more than one relationship was found…"
 * and INSERT…RETURNING / UPDATE…RETURNING fail — so discovery finds leads but creates 0.
 */
export const PROSPECT_CATEGORY_EMBED =
  'service_categories!professional_prospects_category_id_fkey ( id, slug, name, name_he )'

const PROSPECT_SELECT = `
  id, name, business_name, phone, whatsapp_phone, phone_normalized, city,
  search_city, business_address, website_url,
  category_id, source_name, source_url, external_id, status, verification_status,
  last_verified_at, contacted_at, consent_at, notes, fit_score,
  fit_class, fit_confidence, fit_reasons, contactability,
  service_areas, services, enrichment, source_refs, license, last_seen_at,
  waitlist_id, professional_id,
  created_by, updated_by, created_at, updated_at,
  ${PROSPECT_CATEGORY_EMBED}
`

async function loadCategoryMap(
  admin: SupabaseClient,
): Promise<Map<string, CategoryRow>> {
  const { data } = await admin
    .from('service_categories')
    .select('id, slug, name, name_he')
  const map = new Map<string, CategoryRow>()
  for (const row of data ?? []) {
    if (row.slug) map.set(row.slug, row as CategoryRow)
    map.set(row.id, row as CategoryRow)
  }
  return map
}

async function resolveCategoryId(
  record: ProspectSourceRecord,
  categories: Map<string, CategoryRow>,
): Promise<string | null> {
  if (record.categoryId) return record.categoryId
  if (record.categorySlug) {
    return categories.get(record.categorySlug)?.id ?? null
  }
  return null
}

async function loadExistingForDedupe(
  admin: SupabaseClient,
): Promise<ExistingProspectLite[]> {
  const { data, error } = await admin
    .from('professional_prospects')
    .select(
      'id, phone_normalized, source_name, external_id, business_name, category_id, city, website_url, source_url',
    )
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    phoneNormalized: r.phone_normalized,
    sourceName: r.source_name,
    externalId: r.external_id,
    businessName: r.business_name,
    categoryId: r.category_id,
    city: r.city,
    websiteHost: normalizeWebsiteHost(
      (r as { website_url?: string | null }).website_url ??
        (r as { source_url?: string | null }).source_url,
    ),
  }))
}

export async function writeProspectEvent(
  admin: SupabaseClient,
  input: {
    prospectId: string
    actorUserId?: string | null
    action: string
    fromStatus?: string | null
    toStatus?: string | null
    payload?: Record<string, unknown>
  },
) {
  const { error } = await admin.from('professional_prospect_events').insert({
    prospect_id: input.prospectId,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    payload: input.payload ?? {},
  })
  if (error) throw error
}

export type IngestResult = {
  created: ProfessionalProspect[]
  updated: ProfessionalProspect[]
  skipped: Array<{ reason: string; existingId?: string; name: string }>
  errors: Array<{ name: string; error: string }>
}

async function linkProspectCategory(
  admin: SupabaseClient,
  prospectId: string,
  categoryId: string | null,
  source = 'discovery',
) {
  if (!categoryId) return
  await admin.from('professional_prospect_categories').upsert(
    {
      prospect_id: prospectId,
      category_id: categoryId,
      source,
    },
    { onConflict: 'prospect_id,category_id', ignoreDuplicates: true },
  )
}

function buildFitFields(record: ProspectSourceRecord) {
  const assessed =
    record.fitClass && record.fitScore != null
      ? {
          score: record.fitScore,
          confidence: record.fitConfidence ?? 50,
          fitClass: record.fitClass,
          reasons: record.fitReasons ?? [],
          contactability: record.contactability ?? 'unknown',
        }
      : (() => {
          const a = assessProspectFit({
            name: record.name,
            businessName: record.businessName,
            phone: record.phone ?? record.whatsappPhone,
            websiteUrl: record.websiteUrl ?? record.sourceUrl,
            address: record.businessAddress,
            placeTypes: record.placeTypes,
            pureServiceAreaBusiness: record.pureServiceAreaBusiness,
          })
          return {
            score: a.score,
            confidence: a.confidence,
            fitClass: a.fitClass,
            reasons: a.reasons,
            contactability: a.contactability,
          }
        })()

  return {
    fit_score: assessed.score,
    fit_class: assessed.fitClass,
    fit_confidence: assessed.confidence,
    fit_reasons: assessed.reasons,
    contactability: assessed.contactability,
  }
}

/**
 * Protected statuses — never revive as fresh discovered or overwrite admin decisions.
 */
const PROTECTED_STATUSES = new Set<ProspectStatus>([
  'rejected',
  'do_not_contact',
  'joined',
  'active',
  'interested',
  'contacted',
])

export async function ingestFromAdapter(
  admin: SupabaseClient,
  adapter: ProspectSourceAdapter,
  actorUserId?: string | null,
  options?: { enrichWebsites?: boolean },
): Promise<IngestResult> {
  const records = await adapter.fetchRecords()
  const ranked = [...records].sort((a, b) => {
    const sa = a.fitScore ?? scorePersonFit(a.name, a.businessName).score
    const sb = b.fitScore ?? scorePersonFit(b.name, b.businessName).score
    return sb - sa
  })

  const categories = await loadCategoryMap(admin)
  const existing = await loadExistingForDedupe(admin)
  const created: ProfessionalProspect[] = []
  const updated: ProfessionalProspect[] = []
  const skipped: IngestResult['skipped'] = []
  const errors: IngestResult['errors'] = []
  const enrichLimit = options?.enrichWebsites === false ? 0 : 12
  let enriched = 0

  for (const record of ranked) {
    const valid = assertSourceRecord(record)
    if (!valid.ok) {
      errors.push({ name: record.name || '?', error: valid.error })
      continue
    }

    const categoryId = await resolveCategoryId(record, categories)
    const phoneNormalized = normalizePhone(record.phone ?? record.whatsappPhone)
    const fitFields = buildFitFields(record)
    const now = new Date().toISOString()

    const dup = findDuplicate(
      candidateFromSourceRecord(record, categoryId),
      existing,
    )

    if (dup) {
      const { data: existingRow, error: existingErr } = await admin
        .from('professional_prospects')
        .select(PROSPECT_SELECT)
        .eq('id', dup.existingId)
        .maybeSingle()

      if (existingErr) {
        errors.push({
          name: record.name,
          error: existingErr.message,
        })
        continue
      }

      if (!existingRow) {
        skipped.push({
          reason: dup.reason,
          existingId: dup.existingId,
          name: record.name,
        })
        continue
      }

      const current = mapProspectRow(existingRow as ProspectRow)

      // Never recreate rejected / DNC as new — merge soft fields only
      if (PROTECTED_STATUSES.has(current.status)) {
        await linkProspectCategory(admin, current.id, categoryId)
        await admin
          .from('professional_prospects')
          .update({ last_seen_at: now })
          .eq('id', current.id)
        skipped.push({
          reason: `protected_${current.status}`,
          existingId: current.id,
          name: record.name,
        })
        continue
      }

      const mergeServices = [
        ...new Set([
          ...(current.services ?? []),
          ...(record.services ?? []),
          ...(record.categorySlug ? [record.categorySlug] : []),
        ]),
      ]

      const website = pickWebsiteUrl(record.websiteUrl, record.sourceUrl)
      const incomingRef: ProspectSourceRef = {
        source: record.sourceName,
        externalId: record.externalId ?? null,
        url: website ?? record.sourceUrl ?? null,
        seenAt: now,
      }
      const mergedRefs = mergeSourceRefs(current.sourceRefs, incomingRef)
      const mergedLicense = preferLicense(current.license, record.license)

      const updates: Record<string, unknown> = {
        last_seen_at: now,
        updated_by: actorUserId ?? null,
        services: mergeServices,
        fit_score: fitFields.fit_score,
        fit_class: fitFields.fit_class,
        fit_confidence: fitFields.fit_confidence,
        fit_reasons: fitFields.fit_reasons,
        contactability: fitFields.contactability,
        source_refs: mergedRefs,
      }
      if (mergedLicense) updates.license = mergedLicense
      if (record.businessAddress && !current.businessAddress) {
        updates.business_address = record.businessAddress
      }
      if (record.phone && !current.phone) {
        updates.phone = record.phone
        updates.phone_normalized = phoneNormalized
      }
      if (record.whatsappPhone && !current.whatsappPhone) {
        updates.whatsapp_phone = record.whatsappPhone
      }
      if (record.sourceUrl && !current.sourceUrl) {
        updates.source_url = record.sourceUrl
      }
      if (website && !current.websiteUrl) {
        updates.website_url = website
      }

      // Enrich when we newly discover a business website
      if (
        enriched < enrichLimit &&
        website &&
        !current.websiteUrl &&
        (fitFields.fit_class === 'suitable' ||
          fitFields.fit_class === 'needs_review')
      ) {
        const enrichment = await enrichFromWebsite(website)
        if (enrichment) {
          updates.enrichment = enrichment
          updates.services = [
            ...new Set([
              ...(updates.services as string[]),
              ...enrichment.services,
            ]),
          ]
          enriched += 1
        }
      }

      // Keep primary category; add junction for additional trade
      if (categoryId && categoryId !== current.categoryId) {
        await linkProspectCategory(admin, current.id, categoryId)
      } else {
        await linkProspectCategory(admin, current.id, categoryId ?? current.categoryId)
      }

      const { data: upd, error: updErr } = await admin
        .from('professional_prospects')
        .update(updates)
        .eq('id', current.id)
        .select(PROSPECT_SELECT)
        .maybeSingle()

      if (updErr || !upd) {
        errors.push({
          name: record.name,
          error: updErr?.message ?? 'merge failed',
        })
        continue
      }

      const mapped = mapProspectRow(upd as ProspectRow)
      // Keep in-memory dedupe index fresh for website/phone
      const lite = existing.find((e) => e.id === mapped.id)
      if (lite) {
        lite.phoneNormalized = mapped.phoneNormalized
        lite.websiteHost = normalizeWebsiteHost(mapped.websiteUrl)
        lite.businessName = mapped.businessName
        lite.categoryId = mapped.categoryId
      }
      await writeProspectEvent(admin, {
        prospectId: mapped.id,
        actorUserId,
        action: 'discovery_merged',
        fromStatus: current.status,
        toStatus: mapped.status,
        payload: {
          source: adapter.name,
          reason: dup.reason,
          fitClass: fitFields.fit_class,
        },
      })
      updated.push(mapped)
      continue
    }

    const verificationStatus = record.verificationStatus ?? 'unverified'
    const website = pickWebsiteUrl(record.websiteUrl, record.sourceUrl)
    const insertRef: ProspectSourceRef = {
      source: record.sourceName,
      externalId: record.externalId ?? null,
      url: website ?? record.sourceUrl ?? null,
      seenAt: now,
    }
    const insertPayload: Record<string, unknown> = {
      name: record.name.trim(),
      business_name: record.businessName?.trim() || null,
      phone: record.phone?.trim() || null,
      whatsapp_phone: record.whatsappPhone?.trim() || null,
      phone_normalized: phoneNormalized,
      city: record.city.trim(),
      search_city: record.searchCity?.trim() || record.city.trim(),
      business_address: record.businessAddress?.trim() || null,
      website_url: website,
      category_id: categoryId,
      source_name: record.sourceName.trim(),
      source_url: record.sourceUrl?.trim() || null,
      external_id: record.externalId?.trim() || null,
      status: 'discovered' as const,
      verification_status: verificationStatus,
      last_verified_at:
        verificationStatus === 'verified' ? now : null,
      notes: record.notes?.trim() || null,
      ...fitFields,
      services: [
        ...new Set([
          ...(record.services ?? []),
          ...(record.categorySlug ? [record.categorySlug] : []),
        ]),
      ],
      service_areas: record.serviceAreas ?? [],
      source_refs: [insertRef],
      license: record.license ?? null,
      last_seen_at: now,
      created_by: actorUserId ?? null,
      updated_by: actorUserId ?? null,
    }

    // Optional website enrichment for promising leads
    if (
      enriched < enrichLimit &&
      (fitFields.fit_class === 'suitable' ||
        fitFields.fit_class === 'needs_review') &&
      website
    ) {
      const enrichment = await enrichFromWebsite(website)
      if (enrichment) {
        insertPayload.enrichment = enrichment
        insertPayload.services = [
          ...new Set([
            ...(insertPayload.services as string[]),
            ...enrichment.services,
          ]),
        ]
        enriched += 1
      }
    }

    const { data, error } = await admin
      .from('professional_prospects')
      .insert(insertPayload)
      .select(PROSPECT_SELECT)
      .single()

    if (error || !data) {
      // Graceful fallback if new columns not migrated yet
      if (
        error?.message?.includes('fit_class') ||
        error?.message?.includes('fit_score') ||
        error?.message?.includes('contactability') ||
        error?.message?.includes('search_city')
      ) {
        const legacy = {
          name: insertPayload.name,
          business_name: insertPayload.business_name,
          phone: insertPayload.phone,
          whatsapp_phone: insertPayload.whatsapp_phone,
          phone_normalized: insertPayload.phone_normalized,
          city: insertPayload.city,
          category_id: insertPayload.category_id,
          source_name: insertPayload.source_name,
          source_url: insertPayload.source_url,
          external_id: insertPayload.external_id,
          status: 'discovered',
          verification_status: verificationStatus,
          notes: insertPayload.notes,
          fit_score: fitFields.fit_score,
          created_by: actorUserId ?? null,
          updated_by: actorUserId ?? null,
        }
        const retry = await admin
          .from('professional_prospects')
          .insert(legacy)
          .select(
            PROSPECT_SELECT.replace(
              /search_city, business_address,\n {2}/,
              '',
            )
              .replace(
                /fit_class, fit_confidence, fit_reasons, contactability,\n {2}/,
                '',
              )
              .replace(
                /service_areas, services, enrichment, last_seen_at,\n {2}/,
                '',
              ),
          )
          .single()
        if (retry.error || !retry.data) {
          errors.push({
            name: record.name,
            error: retry.error?.message ?? error.message ?? 'insert failed',
          })
          continue
        }
        const mapped = mapProspectRow({
          ...(retry.data as unknown as ProspectRow),
          ...fitFields,
        })
        existing.push({
          id: mapped.id,
          phoneNormalized: mapped.phoneNormalized,
          sourceName: mapped.sourceName,
          externalId: mapped.externalId,
          businessName: mapped.businessName,
          categoryId: mapped.categoryId,
          city: mapped.city,
          websiteHost: normalizeWebsiteHost(mapped.websiteUrl),
        })
        await linkProspectCategory(admin, mapped.id, categoryId)
        await writeProspectEvent(admin, {
          prospectId: mapped.id,
          actorUserId,
          action: 'created',
          fromStatus: null,
          toStatus: 'discovered',
          payload: { source: adapter.name, fitClass: fitFields.fit_class },
        })
        created.push(mapped)
        continue
      }
      errors.push({ name: record.name, error: error?.message ?? 'insert failed' })
      continue
    }

    const mapped = mapProspectRow(data as ProspectRow)
    existing.push({
      id: mapped.id,
      phoneNormalized: mapped.phoneNormalized,
      sourceName: mapped.sourceName,
      externalId: mapped.externalId,
      businessName: mapped.businessName,
      categoryId: mapped.categoryId,
      city: mapped.city,
      websiteHost: normalizeWebsiteHost(mapped.websiteUrl),
    })
    await linkProspectCategory(admin, mapped.id, categoryId)
    await writeProspectEvent(admin, {
      prospectId: mapped.id,
      actorUserId,
      action: 'created',
      fromStatus: null,
      toStatus: 'discovered',
      payload: { source: adapter.name, fitClass: fitFields.fit_class },
    })
    created.push(mapped)
  }

  return { created, updated, skipped, errors }
}

/**
 * Remove prior auto-discovery leads so a fresh run can replace them.
 * Keeps anyone already contacted / joined / DNC (and manual CSV entries).
 */
export async function clearReplaceableAutoProspects(
  admin: SupabaseClient,
): Promise<{ deleted: number }> {
  const replaceableStatuses: ProspectStatus[] = [
    'discovered',
    'verified',
    'approved',
    'rejected',
  ]
  const autoSources = [
    'google_places',
    'osm',
    'gov_pest_control',
  ]

  const { data, error } = await admin
    .from('professional_prospects')
    .delete()
    .in('status', replaceableStatuses)
    .in('source_name', autoSources)
    .select('id')

  if (error) throw error
  return { deleted: data?.length ?? 0 }
}

export async function listProspects(
  admin: SupabaseClient,
  filters: ProspectListFilters = {},
): Promise<{ items: ProfessionalProspect[]; total: number }> {
  const limit = Math.min(filters.limit ?? 50, 200)
  const offset = filters.offset ?? 0

  let query = admin
    .from('professional_prospects')
    .select(PROSPECT_SELECT, { count: 'exact' })
    .order('fit_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    query = query.in('status', statuses)
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.sourceName) query = query.eq('source_name', filters.sourceName)
  if (filters.city) query = query.ilike('city', filters.city)
  if (filters.fitClass) {
    const classes = Array.isArray(filters.fitClass)
      ? filters.fitClass
      : [filters.fitClass]
    query = query.in('fit_class', classes)
  }
  if (filters.contactability) {
    query = query.eq('contactability', filters.contactability)
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim()
    const phoneQ = normalizePhone(q)
    const orParts = [
      `name.ilike.%${q}%`,
      `business_name.ilike.%${q}%`,
      `phone.ilike.%${q}%`,
      `whatsapp_phone.ilike.%${q}%`,
    ]
    if (phoneQ) orParts.push(`phone_normalized.eq.${phoneQ}`)
    query = query.or(orParts.join(','))
  }

  const { data, error, count } = await query
  if (error) {
    // fit_score column may be missing until migration is applied
    if (error.message?.includes('fit_score')) {
      let fallback = admin
        .from('professional_prospects')
        .select(PROSPECT_SELECT.replace(', fit_score', ''), { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (filters.status) {
        const statuses = Array.isArray(filters.status)
          ? filters.status
          : [filters.status]
        fallback = fallback.in('status', statuses)
      }
      if (filters.categoryId) fallback = fallback.eq('category_id', filters.categoryId)
      if (filters.sourceName) fallback = fallback.eq('source_name', filters.sourceName)
      if (filters.city) fallback = fallback.ilike('city', filters.city)
      const retry = await fallback
      if (retry.error) throw retry.error
      const items = (retry.data ?? [])
        .map((r) => mapProspectRow(r as unknown as ProspectRow))
        .map((p) => ({
          ...p,
          fitScore: scorePersonFit(p.name, p.businessName).score,
        }))
        .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
      return { items, total: retry.count ?? 0 }
    }
    throw error
  }

  return {
    items: (data ?? []).map((r) => mapProspectRow(r as ProspectRow)),
    total: count ?? 0,
  }
}

export async function getProspectCounters(
  admin: SupabaseClient,
): Promise<ProspectCounters> {
  const { data, error } = await admin
    .from('professional_prospects')
    .select(
      `status, city, category_id, fit_class, verification_status, ${PROSPECT_CATEGORY_EMBED}`,
    )

  if (error) throw error
  const rows = data ?? []

  const byStatus: Record<string, number> = {}
  const byFitClass: Record<string, number> = {}
  const byCityMap = new Map<string, number>()
  const byCatMap = new Map<string, { categoryId: string | null; name: string; count: number }>()

  let verifiedCount = 0
  let needsReviewCount = 0
  const recruitCity = getRecruitCity()
  const recruitSlugs = new Set(getRecruitCategorySlugs())

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
    const fc = (row as { fit_class?: string | null }).fit_class || 'unknown'
    byFitClass[fc] = (byFitClass[fc] ?? 0) + 1
    if (fc === 'needs_review') needsReviewCount += 1
    const city = row.city || '—'
    byCityMap.set(city, (byCityMap.get(city) ?? 0) + 1)

    const catRel = row.service_categories as
      | { name?: string; name_he?: string | null; slug?: string | null }
      | { name?: string; name_he?: string | null; slug?: string | null }[]
      | null
    const cat = Array.isArray(catRel) ? catRel[0] : catRel
    const catKey = row.category_id ?? 'none'
    const catName = cat?.name_he || cat?.name || 'ללא קטגוריה'
    const prev = byCatMap.get(catKey)
    byCatMap.set(catKey, {
      categoryId: row.category_id,
      name: catName,
      count: (prev?.count ?? 0) + 1,
    })

    const funnelOk = ['verified', 'approved', 'contacted', 'interested', 'joined', 'active']
    if (
      funnelOk.includes(row.status) &&
      row.city?.trim() === recruitCity &&
      cat?.slug &&
      recruitSlugs.has(cat.slug)
    ) {
      verifiedCount += 1
    }
  }

  return {
    byStatus,
    byCategory: [...byCatMap.values()].sort((a, b) => b.count - a.count),
    byCity: [...byCityMap.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count),
    byFitClass,
    needsReviewCount,
    total: rows.length,
    verifiedTarget: {
      city: recruitCity,
      perCategory: getRecruitPerCategoryTarget(),
      categorySlugs: [...recruitSlugs],
      verifiedCount,
    },
  }
}

export async function getProspectById(
  admin: SupabaseClient,
  id: string,
): Promise<{ prospect: ProfessionalProspect; events: ProspectEvent[] } | null> {
  const { data, error } = await admin
    .from('professional_prospects')
    .select(PROSPECT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: events, error: evErr } = await admin
    .from('professional_prospect_events')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (evErr) throw evErr

  return {
    prospect: mapProspectRow(data as ProspectRow),
    events: (events ?? []).map((e) => ({
      id: e.id,
      prospectId: e.prospect_id,
      actorUserId: e.actor_user_id,
      action: e.action,
      fromStatus: e.from_status,
      toStatus: e.to_status,
      payload: (e.payload ?? {}) as Record<string, unknown>,
      createdAt: e.created_at,
    })),
  }
}

export async function updateProspect(
  admin: SupabaseClient,
  id: string,
  patch: {
    status?: ProspectStatus
    verificationStatus?: VerificationStatus
    notes?: string | null
    name?: string
    businessName?: string | null
    phone?: string | null
    whatsappPhone?: string | null
    city?: string
    categoryId?: string | null
    sourceUrl?: string | null
    professionalId?: string | null
  },
  actorUserId?: string | null,
): Promise<ProfessionalProspect> {
  const current = await getProspectById(admin, id)
  if (!current) throw new Error('Prospect not found')

  const updates: Record<string, unknown> = {
    updated_by: actorUserId ?? null,
  }

  if (patch.status && patch.status !== current.prospect.status) {
    const allowed = assertTransition(current.prospect.status, patch.status)
    if (!allowed.ok) throw new Error(allowed.error)
    updates.status = patch.status
    if (patch.status === 'contacted' && !current.prospect.contactedAt) {
      updates.contacted_at = new Date().toISOString()
    }
    if (patch.status === 'joined' && !current.prospect.consentAt) {
      updates.consent_at = new Date().toISOString()
    }
  }

  if (patch.verificationStatus) {
    updates.verification_status = patch.verificationStatus
    if (patch.verificationStatus === 'verified') {
      updates.last_verified_at = new Date().toISOString()
      if (
        !patch.status &&
        current.prospect.status === 'discovered'
      ) {
        updates.status = 'verified'
      }
    }
  }

  if (patch.notes !== undefined) updates.notes = patch.notes
  if (patch.name !== undefined) updates.name = patch.name.trim()
  if (patch.businessName !== undefined) {
    updates.business_name = patch.businessName?.trim() || null
  }
  if (patch.phone !== undefined) {
    updates.phone = patch.phone?.trim() || null
    updates.phone_normalized = normalizePhone(
      patch.phone ?? patch.whatsappPhone ?? current.prospect.whatsappPhone,
    )
  }
  if (patch.whatsappPhone !== undefined) {
    updates.whatsapp_phone = patch.whatsappPhone?.trim() || null
    if (!patch.phone) {
      updates.phone_normalized = normalizePhone(
        current.prospect.phone ?? patch.whatsappPhone,
      )
    }
  }
  if (patch.city !== undefined) updates.city = patch.city.trim()
  if (patch.categoryId !== undefined) updates.category_id = patch.categoryId
  if (patch.sourceUrl !== undefined) {
    updates.source_url = patch.sourceUrl?.trim() || null
  }
  if (patch.professionalId !== undefined) {
    updates.professional_id = patch.professionalId
  }

  const { data, error } = await admin
    .from('professional_prospects')
    .update(updates)
    .eq('id', id)
    .select(PROSPECT_SELECT)
    .single()

  if (error || !data) throw error ?? new Error('Update failed')

  const mapped = mapProspectRow(data as ProspectRow)
  const statusChanged =
    patch.status && patch.status !== current.prospect.status

  await writeProspectEvent(admin, {
    prospectId: id,
    actorUserId,
    action: statusChanged ? 'status_changed' : 'updated',
    fromStatus: current.prospect.status,
    toStatus: mapped.status,
    payload: { patch },
  })

  return mapped
}

export async function bulkUpdateStatus(
  admin: SupabaseClient,
  ids: string[],
  status: ProspectStatus,
  actorUserId?: string | null,
): Promise<{ updated: number; errors: Array<{ id: string; error: string }> }> {
  let updated = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const id of ids) {
    try {
      await updateProspect(admin, id, { status }, actorUserId)
      updated += 1
    } catch (e) {
      errors.push({
        id,
        error: e instanceof Error ? e.message : 'update failed',
      })
    }
  }

  return { updated, errors }
}

export async function prepareContactLink(
  admin: SupabaseClient,
  id: string,
  actorUserId?: string | null,
): Promise<{ whatsappUrl: string; message: string; prospect: ProfessionalProspect }> {
  const current = await getProspectById(admin, id)
  if (!current) throw new Error('Prospect not found')

  let { prospect } = current
  if (prospect.status === 'do_not_contact' || prospect.status === 'rejected') {
    throw new Error('אין ליצור קשר עם ליד זה')
  }

  // Opening WhatsApp may auto-approve — does NOT mark contacted
  if (prospect.status === 'discovered' || prospect.status === 'verified') {
    prospect = await updateProspect(
      admin,
      id,
      { status: 'approved' },
      actorUserId,
    )
  }

  if (!isContactAllowed(prospect.status) && prospect.status !== 'approved') {
    throw new Error('ניתן ליצור קשר רק אחרי אישור (approved) ומעלה')
  }

  const phone = prospect.whatsappPhone || prospect.phone
  if (!phone) throw new Error('חסר מספר טלפון')

  const categoryLabel =
    prospect.categoryNameHe || prospect.categoryName || 'השירות שלך'

  const demand = await countMatchingOpenRequests(admin, {
    categoryId: prospect.categoryId,
    city: prospect.city,
  })

  const message = buildRecruitWhatsAppMessage({
    name: prospect.name,
    category: categoryLabel,
    city: prospect.city,
    matchingOpenRequests: demand > 0 ? demand : null,
  })

  const whatsappUrl = buildWhatsAppLink(phone, message)
  if (!whatsappUrl) throw new Error('מספר טלפון לא תקין')

  await writeProspectEvent(admin, {
    prospectId: id,
    actorUserId,
    action: 'contact_link_opened',
    fromStatus: prospect.status,
    toStatus: prospect.status,
    payload: { channel: 'whatsapp_manual', note: 'link_open_is_not_send' },
  })

  return { whatsappUrl, message, prospect }
}

/** Explicit confirmation that a WhatsApp message was sent. */
export async function confirmContactSent(
  admin: SupabaseClient,
  id: string,
  actorUserId?: string | null,
): Promise<ProfessionalProspect> {
  const current = await getProspectById(admin, id)
  if (!current) throw new Error('Prospect not found')

  let { prospect } = current
  if (prospect.status === 'do_not_contact' || prospect.status === 'rejected') {
    throw new Error('אין ליצור קשר עם ליד זה')
  }

  if (prospect.status === 'discovered' || prospect.status === 'verified') {
    prospect = await updateProspect(
      admin,
      id,
      { status: 'approved' },
      actorUserId,
    )
  }

  if (prospect.status === 'approved') {
    return updateProspect(admin, id, { status: 'contacted' }, actorUserId)
  }

  if (!prospect.contactedAt) {
    const { data, error } = await admin
      .from('professional_prospects')
      .update({
        contacted_at: new Date().toISOString(),
        updated_by: actorUserId ?? null,
      })
      .eq('id', id)
      .select(PROSPECT_SELECT)
      .single()
    if (error || !data) throw new Error(error?.message ?? 'update failed')
    await writeProspectEvent(admin, {
      prospectId: id,
      actorUserId,
      action: 'contact_confirmed',
      fromStatus: prospect.status,
      toStatus: prospect.status,
      payload: { channel: 'whatsapp_manual' },
    })
    return mapProspectRow(data as ProspectRow)
  }

  await writeProspectEvent(admin, {
    prospectId: id,
    actorUserId,
    action: 'contact_confirmed',
    fromStatus: prospect.status,
    toStatus: prospect.status,
    payload: { channel: 'whatsapp_manual', already: true },
  })
  return prospect
}

export async function exportProspectsCsv(
  admin: SupabaseClient,
  filters: ProspectListFilters = {},
): Promise<string> {
  const { items } = await listProspects(admin, {
    ...filters,
    limit: 5000,
    offset: 0,
  })

  return serializeProspectsCsv(
    items.map((p) => ({
      name: p.name,
      business_name: p.businessName,
      phone: p.phone,
      whatsapp_phone: p.whatsappPhone,
      city: p.city,
      category_slug: p.categorySlug,
      source_name: p.sourceName,
      source_url: p.sourceUrl,
      external_id: p.externalId,
      notes: p.notes,
      verification_status: p.verificationStatus,
    })),
  )
}

/**
 * When a professional joins the waitlist with a matching phone,
 * link the prospect and move to joined (never create professionals here).
 */
export async function linkProspectOnWaitlistJoin(
  admin: SupabaseClient,
  input: {
    phone: string
    waitlistId?: string | null
  },
): Promise<ProfessionalProspect | null> {
  const phoneNormalized = normalizePhone(input.phone)
  if (!phoneNormalized) return null

  const { data, error } = await admin
    .from('professional_prospects')
    .select(PROSPECT_SELECT)
    .eq('phone_normalized', phoneNormalized)
    .maybeSingle()

  if (error) {
    console.warn('[prospects] join link lookup failed', error.message)
    return null
  }
  if (!data) return null

  const prospect = mapProspectRow(data as ProspectRow)
  if (prospect.status === 'do_not_contact') return prospect

  const updates: Record<string, unknown> = {
    consent_at: prospect.consentAt ?? new Date().toISOString(),
  }
  if (input.waitlistId) updates.waitlist_id = input.waitlistId

  if (prospect.status !== 'joined' && prospect.status !== 'active') {
    updates.status = 'joined'
  }

  const { data: updated, error: upErr } = await admin
    .from('professional_prospects')
    .update(updates)
    .eq('id', prospect.id)
    .select(PROSPECT_SELECT)
    .single()

  if (upErr || !updated) {
    console.warn('[prospects] join link update failed', upErr?.message)
    return prospect
  }

  const mapped = mapProspectRow(updated as ProspectRow)
  await writeProspectEvent(admin, {
    prospectId: mapped.id,
    action: 'joined_via_waitlist',
    fromStatus: prospect.status,
    toStatus: mapped.status,
    payload: { waitlistId: input.waitlistId ?? null },
  })

  return mapped
}

/**
 * When a professional profile is claimed/linked by phone, mark prospect active.
 */
export async function linkProspectToProfessional(
  admin: SupabaseClient,
  input: {
    professionalId: string
    phone?: string | null
    actorUserId?: string | null
  },
): Promise<ProfessionalProspect | null> {
  let prospect: ProfessionalProspect | null = null

  if (input.phone) {
    const phoneNormalized = normalizePhone(input.phone)
    if (phoneNormalized) {
      const { data } = await admin
        .from('professional_prospects')
        .select(PROSPECT_SELECT)
        .eq('phone_normalized', phoneNormalized)
        .maybeSingle()
      if (data) prospect = mapProspectRow(data as ProspectRow)
    }
  }

  if (!prospect) {
    const { data } = await admin
      .from('professional_prospects')
      .select(PROSPECT_SELECT)
      .eq('professional_id', input.professionalId)
      .maybeSingle()
    if (data) prospect = mapProspectRow(data as ProspectRow)
  }

  if (!prospect) return null
  if (prospect.status === 'do_not_contact') return prospect

  return updateProspect(
    admin,
    prospect.id,
    {
      status: 'active',
      professionalId: input.professionalId,
    },
    input.actorUserId,
  )
}
