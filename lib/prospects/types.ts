import type {
  ProspectLicense,
  ProspectSourceRef,
} from '@/lib/prospects/source-refs'

export type { ProspectLicense, ProspectSourceRef }

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

export const FIT_CLASSES = [
  'suitable',
  'needs_review',
  'unsuitable',
  'unknown',
] as const

export type FitClass = (typeof FIT_CLASSES)[number]

export const CONTACTABILITY_VALUES = [
  'mobile',
  'landline',
  'unknown',
  'none',
] as const

export type Contactability = (typeof CONTACTABILITY_VALUES)[number]

/** Unified record returned by every source adapter before normalize/dedupe/save. */
export type ProspectSourceRecord = {
  name: string
  businessName?: string | null
  phone?: string | null
  whatsappPhone?: string | null
  city: string
  searchCity?: string | null
  businessAddress?: string | null
  categorySlug?: string | null
  categoryId?: string | null
  /** Extra category slugs when one place matches multiple trades */
  categorySlugs?: string[] | null
  sourceName: string
  sourceUrl?: string | null
  /** Real business website (not maps URI) */
  websiteUrl?: string | null
  externalId?: string | null
  notes?: string | null
  fitScore?: number | null
  fitClass?: FitClass | null
  fitConfidence?: number | null
  fitReasons?: string[] | null
  contactability?: Contactability | null
  services?: string[] | null
  serviceAreas?: string[] | null
  queryKey?: string | null
  placeTypes?: string[] | null
  pureServiceAreaBusiness?: boolean | null
  verificationStatus?: VerificationStatus
  license?: ProspectLicense | null
}

export type ProfessionalProspect = {
  id: string
  name: string
  businessName: string | null
  phone: string | null
  whatsappPhone: string | null
  phoneNormalized: string | null
  city: string
  searchCity: string | null
  businessAddress: string | null
  categoryId: string | null
  sourceName: string
  sourceUrl: string | null
  websiteUrl?: string | null
  externalId: string | null
  status: ProspectStatus
  verificationStatus: VerificationStatus
  lastVerifiedAt: string | null
  contactedAt: string | null
  consentAt: string | null
  notes: string | null
  fitScore?: number | null
  fitClass?: FitClass | null
  fitConfidence?: number | null
  fitReasons?: string[] | null
  contactability?: Contactability | null
  serviceAreas?: string[] | null
  services?: string[] | null
  enrichment?: Record<string, unknown> | null
  sourceRefs?: ProspectSourceRef[] | null
  license?: ProspectLicense | null
  lastSeenAt?: string | null
  waitlistId: string | null
  professionalId: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  categoryName?: string | null
  categorySlug?: string | null
  categoryNameHe?: string | null
  categoryIds?: string[] | null
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
  fitClass?: FitClass | FitClass[]
  contactability?: Contactability
  limit?: number
  offset?: number
}

export type ProspectCounters = {
  byStatus: Record<string, number>
  byCategory: Array<{ categoryId: string | null; name: string; count: number }>
  byCity: Array<{ city: string; count: number }>
  byFitClass: Record<string, number>
  total: number
  needsReviewCount: number
  verifiedTarget: {
    city: string
    perCategory: number
    categorySlugs: string[]
    verifiedCount: number
  }
}
