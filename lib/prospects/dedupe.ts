import { normalizePhone } from '@/lib/prospects/phone'
import type { ProspectSourceRecord } from '@/lib/prospects/types'

export function normalizeBusinessKey(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/["'`״׳]/g, '')
    .replace(/\s+/g, ' ')
}

export type DedupeCandidate = {
  phoneNormalized?: string | null
  sourceName?: string | null
  externalId?: string | null
  businessName?: string | null
  categoryId?: string | null
  city?: string | null
}

export type ExistingProspectLite = {
  id: string
  phoneNormalized: string | null
  sourceName: string
  externalId: string | null
  businessName: string | null
  categoryId: string | null
  city: string
}

export type DedupeMatch = {
  reason: 'phone' | 'source_external' | 'business_category_city'
  existingId: string
}

export function findDuplicate(
  candidate: DedupeCandidate,
  existing: ExistingProspectLite[],
): DedupeMatch | null {
  const phone = candidate.phoneNormalized ?? null
  if (phone) {
    const hit = existing.find((e) => e.phoneNormalized && e.phoneNormalized === phone)
    if (hit) return { reason: 'phone', existingId: hit.id }
  }

  if (candidate.sourceName && candidate.externalId) {
    const hit = existing.find(
      (e) =>
        e.sourceName === candidate.sourceName &&
        e.externalId &&
        e.externalId === candidate.externalId,
    )
    if (hit) return { reason: 'source_external', existingId: hit.id }
  }

  const biz = normalizeBusinessKey(candidate.businessName)
  if (biz && candidate.categoryId && candidate.city) {
    const cityNorm = candidate.city.trim().toLowerCase()
    const hit = existing.find(
      (e) =>
        e.categoryId === candidate.categoryId &&
        e.city.trim().toLowerCase() === cityNorm &&
        normalizeBusinessKey(e.businessName) === biz,
    )
    if (hit) return { reason: 'business_category_city', existingId: hit.id }
  }

  return null
}

export function candidateFromSourceRecord(
  record: ProspectSourceRecord,
  categoryId: string | null,
): DedupeCandidate {
  return {
    phoneNormalized: normalizePhone(record.phone ?? record.whatsappPhone),
    sourceName: record.sourceName,
    externalId: record.externalId ?? null,
    businessName: record.businessName ?? record.name,
    categoryId,
    city: record.city,
  }
}
