import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizePhone } from '@/lib/prospects/phone'

export type SmsProspect = {
  id: string
  phone: string | null
  whatsapp_phone: string | null
  status: string
  waitlist_id?: string | null
}

function mobile(raw: string | null): string | null {
  const normalized = normalizePhone(raw)
  return normalized && /^9725\d{8}$/.test(normalized)
    ? `0${normalized.slice(3)}` : null
}

export function selectSmsRecipients(rows: SmsProspect[], blockedPhones: string[] = []) {
  // Opt-out, not-relevant, and already-registered numbers suppress every duplicate.
  const blocked = new Set(rows.filter(r =>
    r.status === 'do_not_contact' || r.status === 'rejected' || r.waitlist_id)
    .flatMap(r => [mobile(r.phone), mobile(r.whatsapp_phone)]).filter(Boolean))
  for (const phone of blockedPhones) {
    const normalized = mobile(phone)
    if (normalized) blocked.add(normalized)
  }
  const phones = new Set<string>()
  let excluded = 0
  let duplicates = 0
  for (const row of rows) {
    const phone = mobile(row.phone) ?? mobile(row.whatsapp_phone)
    if (row.status === 'do_not_contact' || row.status === 'rejected' || row.waitlist_id || !phone || blocked.has(phone)) {
      excluded++
    } else if (phones.has(phone)) {
      duplicates++
    } else {
      phones.add(phone)
    }
  }
  const recipients = [...phones].sort()
  return {
    recipients,
    total: rows.length,
    excluded,
    duplicates,
    count: recipients.length,
    snapshot: createHash('sha256').update(JSON.stringify(recipients)).digest('hex'),
  }
}

async function loadPaged(admin: SupabaseClient, table: 'professional_prospects' | 'pro_waitlist', columns: string) {
  const rows: Array<Record<string, unknown>> = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin.from(table).select(columns).order('id').range(offset, offset + 499)
    if (error) throw new Error(table === 'pro_waitlist' ? 'טעינת הנרשמים נכשלה' : 'טעינת אנשי המקצוע נכשלה')
    const page = (data ?? []) as unknown as Array<Record<string, unknown>>
    rows.push(...page)
    if (!data || data.length < 500) break
  }
  return rows
}

export async function loadSmsRecipients(admin: SupabaseClient) {
  // Supabase's default 1,000-row response limit must not truncate the audience.
  const [prospects, waitlist] = await Promise.all([
    loadPaged(admin, 'professional_prospects', 'id, phone, whatsapp_phone, status, waitlist_id'),
    loadPaged(admin, 'pro_waitlist', 'id, phone'),
  ])
  return selectSmsRecipients(
    prospects as SmsProspect[],
    waitlist.map((row) => String(row.phone ?? '')),
  )
}
