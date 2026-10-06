import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizePhone } from '@/lib/prospects/phone'

export type SmsProspect = {
  id: string
  phone: string | null
  whatsapp_phone: string | null
  status: string
}

function mobile(raw: string | null): string | null {
  const normalized = normalizePhone(raw)
  return normalized && /^9725\d{8}$/.test(normalized)
    ? `0${normalized.slice(3)}` : null
}

export function selectSmsRecipients(rows: SmsProspect[]) {
  // A do-not-contact entry also suppresses duplicates using the same number.
  const blocked = new Set(rows.filter(r => r.status === 'do_not_contact')
    .flatMap(r => [mobile(r.phone), mobile(r.whatsapp_phone)]).filter(Boolean))
  const phones = new Set<string>()
  let excluded = 0
  let duplicates = 0
  for (const row of rows) {
    const phone = mobile(row.phone) ?? mobile(row.whatsapp_phone)
    if (row.status === 'do_not_contact' || !phone || blocked.has(phone)) {
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

export async function loadSmsRecipients(admin: SupabaseClient) {
  const rows: SmsProspect[] = []
  // Supabase's default 1,000-row response limit must not truncate the audience.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin.from('professional_prospects')
      .select('id, phone, whatsapp_phone, status').order('id').range(offset, offset + 499)
    if (error) throw new Error('טעינת אנשי המקצוע נכשלה')
    rows.push(...(data ?? []))
    if (!data || data.length < 500) break
  }
  return selectSmsRecipients(rows)
}
