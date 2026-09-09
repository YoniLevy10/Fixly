import type { ProspectSourceRecord } from '@/lib/prospects/types'

/**
 * Every data source must implement this adapter.
 * Core ingest logic never talks to providers directly.
 */
export interface ProspectSourceAdapter {
  readonly name: string
  fetchRecords(input?: unknown): Promise<ProspectSourceRecord[]>
}

export function assertSourceRecord(
  record: ProspectSourceRecord,
): { ok: true } | { ok: false; error: string } {
  if (!record.name?.trim()) return { ok: false, error: 'name is required' }
  if (!record.city?.trim()) return { ok: false, error: 'city is required' }
  if (!record.sourceName?.trim()) {
    return { ok: false, error: 'sourceName is required' }
  }
  if (!record.phone?.trim() && !record.whatsappPhone?.trim() && !record.externalId) {
    return {
      ok: false,
      error: 'phone, whatsappPhone, or externalId is required',
    }
  }
  return { ok: true }
}
