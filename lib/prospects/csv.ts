import type { ProspectSourceRecord, VerificationStatus } from '@/lib/prospects/types'
import { VERIFICATION_STATUSES } from '@/lib/prospects/types'

const CSV_HEADERS = [
  'name',
  'business_name',
  'phone',
  'whatsapp_phone',
  'city',
  'category_slug',
  'source_name',
  'source_url',
  'external_id',
  'notes',
  'verification_status',
] as const

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells.map((c) => c.trim())
}

export function serializeProspectsCsv(
  rows: Array<Record<string, string | null | undefined>>,
): string {
  const header = CSV_HEADERS.join(',')
  const body = rows.map((row) =>
    CSV_HEADERS.map((h) => escapeCsvCell(String(row[h] ?? ''))).join(','),
  )
  return [header, ...body].join('\n')
}

export type CsvParseResult = {
  records: ProspectSourceRecord[]
  errors: Array<{ line: number; error: string }>
}

export function parseProspectsCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const errors: CsvParseResult['errors'] = []
  const records: ProspectSourceRecord[] = []

  if (lines.length === 0) {
    return { records: [], errors: [{ line: 0, error: 'קובץ ריק' }] }
  }

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const indexOf = (name: string) => headerCells.indexOf(name)

  if (indexOf('name') < 0) {
    return {
      records: [],
      errors: [{ line: 1, error: 'חסרה עמודת name' }],
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const get = (col: string) => {
      const idx = indexOf(col)
      return idx >= 0 ? cells[idx]?.trim() || '' : ''
    }

    const name = get('name')
    if (!name) {
      errors.push({ line: i + 1, error: 'שם חסר' })
      continue
    }

    const verificationRaw = get('verification_status') || 'unverified'
    const verificationStatus = (
      VERIFICATION_STATUSES as readonly string[]
    ).includes(verificationRaw)
      ? (verificationRaw as VerificationStatus)
      : 'unverified'

    records.push({
      name,
      businessName: get('business_name') || null,
      phone: get('phone') || null,
      whatsappPhone: get('whatsapp_phone') || null,
      city: get('city') || 'ירושלים',
      categorySlug: get('category_slug') || null,
      sourceName: get('source_name') || 'csv',
      sourceUrl: get('source_url') || null,
      externalId: get('external_id') || null,
      notes: get('notes') || null,
      verificationStatus,
    })
  }

  return { records, errors }
}

export { CSV_HEADERS }
