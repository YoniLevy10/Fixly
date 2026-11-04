import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import type { ProspectLicense } from '@/lib/prospects/source-refs'
import { getDiscoveryCity } from '@/lib/prospects/discovery-mapping'
import {
  assessProspectFit,
  shouldKeepDiscoveredProspect,
} from '@/lib/prospects/fit-score'

/**
 * Licensed pest controllers (מדבירים מורשים) — Ministry of Environmental Protection
 * via data.gov.il CKAN datastore.
 *
 * Package: madbirim (fecc5a5f-8e69-43f0-9c0f-6121fb93a78e)
 * Resource id verified 2026-09-09 — update if CKAN rotates the upload.
 */
export const GOV_PEST_RESOURCE_ID = '4941fd97-9f9f-4e45-b117-9f71735e9845'

const DATASTORE_URL =
  'https://data.gov.il/api/3/action/datastore_search'

/** Jerusalem + common metro settlements for soft-launch filter. */
export const JERUSALEM_PEST_SETTLEMENTS = [
  'ירושלים',
  'מעלה אדומים',
  'מבשרת ציון',
  'גבעת זאב',
  'בית שמש',
  'אבו גוש',
  'מבשרת',
  'פסגת זאב',
] as const

export type GovPestRow = {
  _id?: number
  LicenseNumber?: number | string
  LastName?: string
  FirstName?: string
  settlement?: string
  Telephone?: string
  LicenseType?: string
  Status?: string
  PermitExpirationDate?: string
  [key: string]: unknown
}

export type GovPestAdapterOptions = {
  city?: string
  resourceId?: string
  /** Inject rows for unit tests (skips network). */
  rows?: GovPestRow[]
  fetchImpl?: typeof fetch
  pageSize?: number
}

export type GovFetchSlice = {
  nextOffset: number
  done: boolean
  /** Page was not requested because the deadline was already too close. */
  stoppedForDeadline: boolean
  fetched: number
}

export function settlementMatchesCity(
  settlement: string | null | undefined,
  city: string,
): boolean {
  const s = (settlement ?? '').trim()
  if (!s) return false
  if (s === city || s.includes(city) || city.includes(s)) return true
  return JERUSALEM_PEST_SETTLEMENTS.some(
    (j) => s === j || s.includes(j) || j.includes(s),
  )
}

export function parseGovPestLicense(row: GovPestRow): ProspectLicense {
  return {
    kind: row.LicenseType?.trim() || 'pest_control',
    number: row.LicenseNumber != null ? String(row.LicenseNumber) : null,
    authority: 'משרד הגנת הסביבה',
    validUntil: row.PermitExpirationDate?.trim() || null,
    status: row.Status?.trim() || null,
    raw: {
      licenseType: row.LicenseType ?? null,
      settlement: row.settlement ?? null,
    },
  }
}

export function govPestRowToRecord(
  row: GovPestRow,
  city: string,
): ProspectSourceRecord | null {
  const first = row.FirstName?.trim() || ''
  const last = row.LastName?.trim() || ''
  const name = `${first} ${last}`.trim()
  if (!name) return null
  if (!settlementMatchesCity(row.settlement, city)) return null

  const phone = row.Telephone?.trim() || null
  const license = parseGovPestLicense(row)
  const licenseNo = license.number || String(row._id ?? name)
  const statusOk = !license.status || /בתוקף/i.test(license.status)

  const assessment = assessProspectFit({
    name,
    businessName: name,
    phone,
    websiteUrl: null,
    address: row.settlement ?? null,
  })

  // Licensed registry → boost toward keep; still drop obvious non-keepers
  if (
    phone &&
    !shouldKeepDiscoveredProspect({
      name,
      businessName: name,
      phone,
    })
  ) {
    return null
  }

  const fitClass = statusOk
    ? assessment.fitClass === 'unsuitable'
      ? 'needs_review'
      : assessment.fitClass === 'unknown'
        ? 'needs_review'
        : assessment.fitClass
    : 'needs_review'

  return {
    name,
    businessName: name,
    phone,
    whatsappPhone:
      assessment.contactability === 'mobile' ? phone : null,
    city: row.settlement?.trim() || city,
    searchCity: city,
    businessAddress: row.settlement?.trim() || null,
    categorySlug: 'pest_control',
    sourceName: 'gov_pest_control',
    sourceUrl: `https://www.gov.il/he/Departments/dynamiccollectors/madbirim`,
    externalId: `gov:pest:${licenseNo}`,
    notes: [
      license.kind,
      license.status ? `סטטוס: ${license.status}` : null,
      license.validUntil ? `תוקף: ${license.validUntil}` : null,
      'מקור: מאגר מדבירים מורשים (data.gov.il)',
    ]
      .filter(Boolean)
      .join(' · '),
    fitScore: Math.max(assessment.score, statusOk ? 62 : 48),
    fitClass,
    fitConfidence: Math.max(assessment.confidence, 70),
    fitReasons: [
      ...assessment.reasons,
      'gov_pest_license',
      statusOk ? 'license_valid' : 'license_status_check',
    ],
    contactability: assessment.contactability,
    services: ['pest_control'],
    verificationStatus: statusOk ? 'verified' : 'unverified',
    license,
  }
}

/**
 * Pilot professional registry adapter — pest control licenses.
 */
export class GovPestControlProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'gov_pest_control'

  private readonly city: string
  private readonly resourceId: string
  private readonly rows?: GovPestRow[]
  private readonly fetchImpl: typeof fetch
  private readonly pageSize: number
  lastFetched = 0
  lastKept = 0
  lastErrors: string[] = []
  lastSlice: GovFetchSlice = {
    nextOffset: 0,
    done: true,
    stoppedForDeadline: false,
    fetched: 0,
  }

  constructor(options: GovPestAdapterOptions = {}) {
    this.city = options.city ?? getDiscoveryCity()
    this.resourceId = options.resourceId ?? GOV_PEST_RESOURCE_ID
    this.rows = options.rows
    this.fetchImpl = options.fetchImpl ?? fetch
    this.pageSize = Math.min(options.pageSize ?? 200, 1000)
  }

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const slice = await this.fetchSlice({ offset: 0, maxPages: 25 })
    return slice.records
  }

  /**
   * One or more CKAN pages. Cron passes maxPages: 1 and a deadline so a
   * national download cannot consume the whole function.
   */
  async fetchSlice(options: {
    offset?: number
    maxPages?: number
    deadlineAt?: number
  } = {}): Promise<GovFetchSlice & { records: ProspectSourceRecord[] }> {
    this.lastErrors = []
    const start = Math.max(0, options.offset ?? 0)
    const maxPages = Math.max(1, options.maxPages ?? 1)
    if (this.rows) {
      const records = this.recordsFromRows(this.rows)
      const slice: GovFetchSlice = {
        nextOffset: this.rows.length,
        done: true,
        stoppedForDeadline: false,
        fetched: this.rows.length,
      }
      this.lastSlice = slice
      this.lastFetched = this.rows.length
      return { ...slice, records }
    }

    const rows: GovPestRow[] = []
    let offset = start
    let done = false
    let stoppedForDeadline = false
    let pages = 0
    const hardCap = 5000

    while (pages < maxPages && offset < hardCap) {
      if (options.deadlineAt != null && options.deadlineAt - Date.now() < 6_000) {
        stoppedForDeadline = true
        break
      }
      const remaining =
        options.deadlineAt != null ? options.deadlineAt - Date.now() : 20_000
      const timeoutMs = Math.min(12_000, Math.max(4_000, remaining - 500))
      const page = await this.fetchPage(offset, timeoutMs)
      pages += 1
      rows.push(...page.records)
      offset += page.records.length
      if (page.records.length < this.pageSize) {
        done = true
        break
      }
      if (page.total != null && offset >= page.total) {
        done = true
        break
      }
    }

    if (!done && !stoppedForDeadline && offset >= hardCap) done = true
    const records = this.recordsFromRows(rows)
    const slice: GovFetchSlice = {
      nextOffset: offset,
      done,
      stoppedForDeadline,
      fetched: rows.length,
    }
    this.lastSlice = slice
    this.lastFetched = rows.length
    return { ...slice, records }
  }

  private recordsFromRows(rows: GovPestRow[]): ProspectSourceRecord[] {
    const out: ProspectSourceRecord[] = []
    const seen = new Set<string>()

    for (const row of rows) {
      try {
        const record = govPestRowToRecord(row, this.city)
        if (!record) continue
        if (record.externalId && seen.has(record.externalId)) continue
        if (record.externalId) seen.add(record.externalId)
        out.push(record)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'row failed'
        this.lastErrors.push(message)
      }
    }

    this.lastKept = out.length
    out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    return out
  }

  private async fetchPage(
    offset: number,
    timeoutMs: number,
  ): Promise<{ records: GovPestRow[]; total: number | null }> {
    const url = new URL(DATASTORE_URL)
    url.searchParams.set('resource_id', this.resourceId)
    url.searchParams.set('limit', String(this.pageSize))
    url.searchParams.set('offset', String(offset))

    const res = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`data.gov.il ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as {
      success?: boolean
      result?: { records?: GovPestRow[]; total?: number }
    }
    if (!json.success) {
      throw new Error('data.gov.il datastore_search failed')
    }
    return {
      records: json.result?.records ?? [],
      total: json.result?.total ?? null,
    }
  }
}
