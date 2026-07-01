import type { Professional } from '@/types/professional'
import type { MockRequest } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'

type CategoryRel =
  | { name: string; name_he?: string | null }
  | { name: string; name_he?: string | null }[]
  | null
  | undefined

type ProfessionalRow = {
  id: string
  title: string | null
  description: string | null
  category_id: string | null
  rating: number | null
  reviews_count: number | null
  hourly_price: number | null
  city: string | null
  available: boolean | null
  profile_image: string | null
  subscription_tier?: string | null
  subscription_until?: string | null
  service_categories?: CategoryRel
}

type RequestRow = {
  id: string
  customer_id: string | null
  professional_id: string | null
  category_id: string | null
  title: string
  description: string | null
  address: string | null
  city: string | null
  status: string | null
  created_at: string | null
  destination_lat?: number | null
  destination_lng?: number | null
  pro_lat?: number | null
  pro_lng?: number | null
  pro_location_updated_at?: string | null
  live_tracking_active?: boolean | null
  professionals?: { title: string | null } | { title: string | null }[] | null
  users?:
    | { full_name: string | null; phone: string | null }
    | { full_name: string | null; phone: string | null }[]
    | null
  service_categories?: CategoryRel
}

function categoryName(rel?: CategoryRel): string {
  if (!rel) return ''
  const item = Array.isArray(rel) ? rel[0] : rel
  return item?.name_he || item?.name || ''
}

function relTitle(
  rel?: { title: string | null } | { title: string | null }[] | null
): string {
  if (!rel) return ''
  if (Array.isArray(rel)) return rel[0]?.title ?? ''
  return rel.title ?? ''
}

function relUser(
  rel?:
    | { full_name: string | null; phone: string | null }
    | { full_name: string | null; phone: string | null }[]
    | null
): { full_name: string | null; phone: string | null } | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

export function mapProfessionalRow(row: ProfessionalRow): Professional {
  const cat = categoryName(row.service_categories)
  const tier = row.subscription_tier ?? 'free'
  const subActive =
    row.subscription_until &&
    new Date(row.subscription_until) > new Date()
  const isProTier = tier === 'pro' || tier === 'pro_plus' || subActive

  return {
    id: row.id,
    name: row.title ?? 'איש מקצוע',
    title: row.description?.slice(0, 40),
    category: cat,
    description: row.description ?? undefined,
    avatarUrl: row.profile_image ?? undefined,
    location: row.city ?? undefined,
    rating: Number(row.rating ?? 0),
    reviewCount: row.reviews_count ?? 0,
    startingPrice: row.hourly_price ?? 0,
    isAvailable: row.available ?? false,
    isApproved: true,
    isFeatured: isProTier || (row.rating ?? 0) >= 4.8,
    completedJobs: row.reviews_count ?? 0,
  }
}

export function mapRequestRow(row: RequestRow): MockRequest {
  const location = [row.address, row.city].filter(Boolean).join(', ') || undefined
  const user = relUser(row.users)

  return {
    id: row.id,
    customerId: row.customer_id ?? '',
    customerName: user?.full_name ?? 'לקוח',
    customerPhone: user?.phone ?? undefined,
    professionalId: row.professional_id ?? '',
    professionalName: relTitle(row.professionals),
    category: categoryName(row.service_categories),
    title: row.title,
    description: row.description ?? '',
    status: (row.status ?? 'pending') as RequestStatus,
    createdAt: row.created_at ?? new Date().toISOString(),
    location,
    destinationLat: row.destination_lat ?? undefined,
    destinationLng: row.destination_lng ?? undefined,
    proLat: row.pro_lat ?? undefined,
    proLng: row.pro_lng ?? undefined,
    proLocationUpdatedAt: row.pro_location_updated_at ?? undefined,
    liveTrackingActive: row.live_tracking_active ?? false,
  }
}
