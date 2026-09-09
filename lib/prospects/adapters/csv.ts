import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import { parseProspectsCsv } from '@/lib/prospects/csv'

export class CsvProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'csv'

  constructor(private readonly csvText: string) {}

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    const { records, errors } = parseProspectsCsv(this.csvText)
    if (errors.length && records.length === 0) {
      throw new Error(errors.map((e) => `שורה ${e.line}: ${e.error}`).join('; '))
    }
    return records.map((r) => ({
      ...r,
      sourceName: r.sourceName || 'csv',
    }))
  }

  parseMeta() {
    return parseProspectsCsv(this.csvText)
  }
}
