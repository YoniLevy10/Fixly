import type { ProspectSourceAdapter } from '@/lib/prospects/adapters/types'
import type { ProspectSourceRecord } from '@/lib/prospects/types'
import { getRecruitCity } from '@/lib/prospects/config'

export type ManualProspectInput = {
  name: string
  businessName?: string | null
  phone?: string | null
  whatsappPhone?: string | null
  city?: string | null
  categorySlug?: string | null
  categoryId?: string | null
  sourceUrl?: string | null
  externalId?: string | null
  notes?: string | null
}

export class ManualProspectAdapter implements ProspectSourceAdapter {
  readonly name = 'manual'

  constructor(private readonly input: ManualProspectInput) {}

  async fetchRecords(): Promise<ProspectSourceRecord[]> {
    return [
      {
        name: this.input.name.trim(),
        businessName: this.input.businessName?.trim() || null,
        phone: this.input.phone?.trim() || null,
        whatsappPhone: this.input.whatsappPhone?.trim() || null,
        city: this.input.city?.trim() || getRecruitCity(),
        categorySlug: this.input.categorySlug ?? null,
        categoryId: this.input.categoryId ?? null,
        sourceName: 'manual',
        sourceUrl: this.input.sourceUrl?.trim() || null,
        externalId: this.input.externalId?.trim() || null,
        notes: this.input.notes?.trim() || null,
        verificationStatus: 'unverified',
      },
    ]
  }
}
