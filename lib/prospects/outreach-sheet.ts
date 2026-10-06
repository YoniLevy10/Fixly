import { createHash } from 'node:crypto'
import { normalizePhone } from '@/lib/prospects/phone'
import type { ProspectStatus } from '@/lib/prospects/types'

/** Outreach list of people not yet registered. Kept apart from pro_waitlist. */
export const OUTREACH_SOURCE = 'outreach_sheet'
export const DEFAULT_SPREADSHEET_ID = '1t8GFErh_jtxdPLezvg9lUjF922LkZkXWKPlMCLuNc_4'
export const DEFAULT_SHEET_GID = '1230906744'
export const DEFAULT_SHEET_TITLE = 'מאגר אנשי תחזוקה'

const SHEET_TO_STATUS: Record<string, ProspectStatus> = {
  'נשלחה הודעה': 'contacted',
  'מעוניין': 'interested',
  'לא רלוונטי': 'rejected',
  'לא ליצור קשר': 'do_not_contact',
  'אין ליצור קשר': 'do_not_contact',
  'נדחה': 'rejected',
  'נוצר קשר': 'contacted',
  'נרשם': 'joined',
}

const STATUS_RANK: Partial<Record<ProspectStatus, number>> = {
  discovered: 0,
  verified: 1,
  approved: 2,
  contacted: 3,
  interested: 4,
  joined: 5,
  active: 6,
}

export type SheetLead = {
  row: number
  region: string
  name: string
  phone: string
  phoneNormalized: string | null
  trades: string
  services: string[]
  categorySlug: string | null
  source: string
  statusLabel: string
  status: ProspectStatus | null
  statusRecognized: boolean
  notes: string
  prospectId: string | null
  uncertain: boolean
}

export type OutreachLink = {
  row: number
  sheetHash: string
  dbHash: string
  pendingPush: boolean
}

export type ExistingOutreachProspect = {
  id: string
  name: string
  phone: string | null
  phoneNormalized: string | null
  city: string
  status: ProspectStatus
  notes: string | null
  services: string[]
  waitlistId: string | null
  link: OutreachLink | null
}

export type OutreachUpdate = {
  id: string
  lead: SheetLead
  name: string
  city: string
  phone: string | null
  status: ProspectStatus
  notes: string | null
  services: string[]
  /** Admin edited the lead; write the shared columns back to the sheet. */
  pushFields: boolean
  pushStatus: boolean
  pushId: boolean
}

export type OutreachPlan = {
  creates: SheetLead[]
  updates: OutreachUpdate[]
  skips: Array<{ row: number; name: string; phone: string; reason: string }>
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += c
      continue
    }
    if (c === '"') {
      quoted = true
      continue
    }
    if (c === ',') {
      row.push(cell)
      cell = ''
      continue
    }
    if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }
    if (c !== '\r') cell += c
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function headerIndex(headers: string[], names: string[]): number {
  const normalized = headers.map((h) => h.replace(/\u200b/g, '').trim())
  return normalized.findIndex((h) => names.includes(h))
}

export function splitTrades(raw: string): string[] {
  return raw
    .split(/[;,\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function tradeSlug(segment: string): string | null {
  if (/איטום/.test(segment)) return 'waterproofing'
  if (/מנעול/.test(segment)) return 'locksmith'
  if (/אינסטל/.test(segment)) return 'plumbing'
  if (/חשמל/.test(segment)) return 'electricity'
  if (/מזגן/.test(segment)) return 'ac'
  if (/צבע|שפכטל/.test(segment)) return 'painting'
  if (/גבס/.test(segment)) return 'drywall'
  if (/שיפוצ|גמר/.test(segment)) return 'renovations'
  if (/הנדימן|אחזק|התקנ|תיקון/.test(segment)) return 'handyman'
  return null
}

export function sheetStatusToProspect(label: string): {
  status: ProspectStatus | null
  recognized: boolean
} {
  const key = label.replace(/\u200b/g, '').trim()
  if (!key) return { status: null, recognized: true }
  const status = SHEET_TO_STATUS[key]
  if (!status) return { status: null, recognized: false }
  return { status, recognized: true }
}

export function prospectStatusToSheet(status: ProspectStatus): string {
  switch (status) {
    case 'contacted':
      return 'נשלחה הודעה'
    case 'interested':
      return 'מעוניין'
    case 'rejected':
      return 'לא רלוונטי'
    case 'do_not_contact':
      return 'לא ליצור קשר'
    case 'joined':
    case 'active':
      return 'נרשם'
    default:
      return ''
  }
}

export function isUncertainLead(name: string, notes: string): boolean {
  if (name.trim().startsWith('להשלמה')) return true
  return /לא זמינים/.test(notes)
}

/** Sheet opt-out wins. A blank sheet cell does not erase a later admin status. */
export function mergeStatus(
  current: ProspectStatus,
  incoming: ProspectStatus | null,
): ProspectStatus {
  if (!incoming) return current
  if (incoming === 'rejected' || incoming === 'do_not_contact') {
    if (current === 'joined' || current === 'active') return current
    return incoming
  }
  if (current === 'rejected' || current === 'do_not_contact') return current
  const currentRank = STATUS_RANK[current] ?? 0
  const incomingRank = STATUS_RANK[incoming] ?? 0
  return incomingRank >= currentRank ? incoming : current
}

export function contentHash(input: {
  region: string
  name: string
  phoneNormalized: string | null
  trades: string
  statusLabel: string
  notes: string
}): string {
  const key = {
    region: input.region.trim(),
    name: input.name.trim(),
    phone: input.phoneNormalized ?? '',
    trades: splitTrades(input.trades).join('; '),
    status: input.statusLabel.replace(/\u200b/g, '').trim(),
    notes: input.notes.trim(),
  }
  return createHash('sha256').update(JSON.stringify(key)).digest('hex')
}

export function leadContentHash(lead: SheetLead): string {
  return contentHash({
    region: lead.region,
    name: lead.name,
    phoneNormalized: lead.phoneNormalized,
    trades: lead.trades,
    statusLabel: lead.statusRecognized
      ? prospectStatusToSheet(lead.status ?? 'discovered')
      : lead.statusLabel,
    notes: lead.notes,
  })
}

export function parseOutreachGrid(grid: string[][]): SheetLead[] {
  if (!grid.length) return []
  const headers = grid[0] ?? []
  const col = {
    region: headerIndex(headers, ['אזור']),
    name: headerIndex(headers, ['שם בעל המקצוע', 'שם']),
    phone: headerIndex(headers, ['טלפון מלא', 'טלפון']),
    trades: headerIndex(headers, ['תחומי עבודה']),
    source: headerIndex(headers, ['מקור']),
    status: headerIndex(headers, ['סטטוס']),
    notes: headerIndex(headers, ['הערות']),
    id: headerIndex(headers, ['מזהה']),
  }
  if (col.name < 0 || col.phone < 0) {
    throw new Error('בגיליון חסרות עמודות השם או הטלפון')
  }
  const cell = (row: string[], index: number) =>
    index < 0 ? '' : (row[index] ?? '').replace(/\u200b/g, '').trim()

  const leads: SheetLead[] = []
  for (let i = 1; i < grid.length; i++) {
    const row = grid[i] ?? []
    const name = cell(row, col.name)
    const phone = cell(row, col.phone)
    const notes = cell(row, col.notes)
    const trades = cell(row, col.trades)
    const services = splitTrades(trades)
    const statusLabel = cell(row, col.status)
    const mapped = sheetStatusToProspect(statusLabel)
    const prospectId = cell(row, col.id)
    if (!name && !phone && !trades && !notes) continue
    leads.push({
      row: i + 1,
      region: cell(row, col.region) || 'לא ידוע',
      name: name || 'ללא שם',
      phone,
      phoneNormalized: normalizePhone(phone),
      trades,
      services,
      categorySlug: services.map(tradeSlug).find(Boolean) ?? null,
      source: cell(row, col.source),
      statusLabel,
      status: mapped.status,
      statusRecognized: mapped.recognized,
      notes,
      prospectId: /^[0-9a-f-]{36}$/i.test(prospectId) ? prospectId : null,
      uncertain: isUncertainLead(name, notes),
    })
  }
  return leads
}

function preferredName(sheetName: string, dbName: string): string {
  const sheet = sheetName.trim()
  const db = dbName.trim()
  if (!sheet || sheet === 'ללא שם' || sheet.startsWith('להשלמה')) return db || sheet
  if (!db) return sheet
  // Keep a richer existing title when the sheet only has a short fragment of it.
  if (db.includes(sheet) && sheet.length + 4 < db.length) return db
  return sheet
}

function mergeNotes(current: string | null, incoming: string): string | null {
  const a = current?.trim() ?? ''
  const b = incoming.trim()
  if (!b) return a || null
  if (!a) return b
  if (a.includes(b)) return a
  if (b.includes(a)) return b
  return `${b}\n${a}`
}

function cityFromSheet(sheetRegion: string, current: string): string {
  const region = sheetRegion.trim()
  if (!region || region === 'לא ידוע') return current.trim() || region || 'לא ידוע'
  return region
}

export function planOutreachSync(
  leads: SheetLead[],
  existing: ExistingOutreachProspect[],
  waitlistPhones: string[],
): OutreachPlan {
  const byPhone = new Map<string, ExistingOutreachProspect>()
  const byId = new Map<string, ExistingOutreachProspect>()
  for (const prospect of existing) {
    byId.set(prospect.id, prospect)
    if (prospect.phoneNormalized) byPhone.set(prospect.phoneNormalized, prospect)
  }
  const registered = new Set(
    waitlistPhones
      .map((phone) => normalizePhone(phone))
      .filter((phone): phone is string => Boolean(phone)),
  )
  const seen = new Set<string>()
  const plan: OutreachPlan = { creates: [], updates: [], skips: [] }

  for (const lead of leads) {
    if (!lead.phoneNormalized) {
      plan.skips.push({
        row: lead.row,
        name: lead.name,
        phone: lead.phone,
        reason: 'אין טלפון תקין',
      })
      continue
    }
    if (seen.has(lead.phoneNormalized)) {
      plan.skips.push({
        row: lead.row,
        name: lead.name,
        phone: lead.phone,
        reason: 'כפילות בגיליון',
      })
      continue
    }
    seen.add(lead.phoneNormalized)

    const match =
      (lead.prospectId ? byId.get(lead.prospectId) : undefined) ??
      byPhone.get(lead.phoneNormalized)

    if (!match) {
      if (registered.has(lead.phoneNormalized)) {
        plan.skips.push({
          row: lead.row,
          name: lead.name,
          phone: lead.phone,
          reason: 'כבר נרשם',
        })
        continue
      }
      plan.creates.push(lead)
      continue
    }

    if (match.waitlistId || registered.has(lead.phoneNormalized)) {
      plan.skips.push({
        row: lead.row,
        name: lead.name,
        phone: lead.phone,
        reason: 'כבר נרשם',
      })
      continue
    }

    if (lead.uncertain && !match.link) {
      plan.skips.push({
        row: lead.row,
        name: lead.name,
        phone: lead.phone,
        reason: 'המספר כבר שמור על ליד קיים, והטלפון בגיליון לא ודאי',
      })
      continue
    }

    const sheetHash = leadContentHash(lead)
    const currentHash = contentHash({
      region: match.city,
      name: match.name,
      phoneNormalized: match.phoneNormalized,
      trades: match.services.join('; '),
      statusLabel: prospectStatusToSheet(match.status),
      notes: match.notes ?? '',
    })
    const sheetEdited = !match.link || match.link.sheetHash !== sheetHash
    const dbEdited = Boolean(match.link && match.link.dbHash !== currentHash)
    const pull = !match.link || (sheetEdited && !dbEdited) || (sheetEdited && dbEdited)
    const pushBecauseDb = Boolean(match.link && dbEdited && !sheetEdited)

    if (pushBecauseDb) {
      plan.updates.push({
        id: match.id,
        lead,
        name: match.name,
        city: match.city,
        phone: match.phone,
        status: match.status,
        notes: match.notes,
        services: match.services,
        pushFields: true,
        pushStatus: false,
        pushId: !lead.prospectId || match.link?.pendingPush === true,
      })
      continue
    }

    if (!pull && match.link?.pendingPush) {
      plan.updates.push({
        id: match.id,
        lead,
        name: match.name,
        city: match.city,
        phone: match.phone,
        status: match.status,
        notes: match.notes,
        services: match.services,
        pushFields: false,
        pushStatus: false,
        pushId: true,
      })
      continue
    }

    if (!pull) continue

    const status = lead.statusRecognized
      ? mergeStatus(match.status, lead.status)
      : match.status
    const services = lead.services.length ? lead.services : match.services
    const name = preferredName(lead.name, match.name)
    const city = cityFromSheet(lead.region, match.city)
    const notes = mergeNotes(match.notes, lead.notes)
    const phone =
      normalizePhone(match.phone) === lead.phoneNormalized
        ? match.phone
        : lead.phone
    const statusLabel = lead.statusRecognized
      ? prospectStatusToSheet(status)
      : lead.statusLabel
    plan.updates.push({
      id: match.id,
      lead,
      name,
      city,
      phone,
      status,
      notes,
      services,
      pushFields: false,
      pushStatus: statusLabel !== lead.statusLabel.trim(),
      pushId: !lead.prospectId,
    })
  }

  return plan
}

export function readOutreachLink(enrichment: unknown): OutreachLink | null {
  if (!enrichment || typeof enrichment !== 'object') return null
  const link = (enrichment as { outreachSheet?: unknown }).outreachSheet
  if (!link || typeof link !== 'object') return null
  const row = (link as { row?: unknown }).row
  const sheetHash = (link as { sheetHash?: unknown }).sheetHash
  const dbHash = (link as { dbHash?: unknown }).dbHash
  if (typeof row !== 'number' || typeof sheetHash !== 'string' || typeof dbHash !== 'string') {
    return null
  }
  return {
    row,
    sheetHash,
    dbHash,
    pendingPush: (link as { pendingPush?: unknown }).pendingPush === true,
  }
}
