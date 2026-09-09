export const PROSPECT_STATUSES = [
  'discovered',
  'verified',
  'approved',
  'contacted',
  'interested',
  'joined',
  'active',
  'rejected',
  'do_not_contact',
] as const

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number]

export const VERIFICATION_STATUSES = [
  'unverified',
  'pending',
  'verified',
  'failed',
] as const

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

/** Unified record returned by every source adapter before normalize/dedupe/save. */
export type ProspectSourceRecord = {
  name: string
  businessName?: string | null
  phone?: string | null
  whatsappPhone?: string | null
  city: string
  categorySlug?: string | null
  categoryId?: string | null
  sourceName: string
  sourceUrl?: string | null
  externalId?: string | null
  notes?: string | null
  /** Midrag-style fit 0–100; higher = better recruit candidate */
  fitScore?: number | null
  verificationStatus?: VerificationStatus
}

export type ProfessionalProspect = {
  id: string
  name: string
  businessName: string | null
  phone: string | null
  whatsappPhone: string | null
  phoneNormalized: string | null
  city: string
  categoryId: string | null
  sourceName: string
  sourceUrl: string | null
  externalId: string | null
  status: ProspectStatus
  verificationStatus: VerificationStatus
  lastVerifiedAt: string | null
  contactedAt: string | null
  consentAt: string | null
  notes: string | null
  fitScore?: number | null
  waitlistId: string | null
  professionalId: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  categoryName?: string | null
  categorySlug?: string | null
  categoryNameHe?: string | null
}

export type ProspectEvent = {
  id: string
  prospectId: string
  actorUserId: string | null
  action: string
  fromStatus: string | null
  toStatus: string | null
  payload: Record<string, unknown>
  createdAt: string
}

export type ProspectListFilters = {
  q?: string
  status?: ProspectStatus | ProspectStatus[]
  categoryId?: string
  sourceName?: string
  city?: string
  limit?: number
  offset?: number
}

export type ProspectCounters = {
  byStatus: Record<string, number>
  byCategory: Array<{ categoryId: string | null; name: string; count: number }>
  byCity: Array<{ city: string; count: number }>
  total: number
  verifiedTarget: {
    city: string
    perCategory: number
    categorySlugs: string[]
    verifiedCount: number
  }
}
