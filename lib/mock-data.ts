/**
 * @deprecated Prefer `@/mock/professionals` — kept for legacy imports during migration.
 */
import { PROFESSIONALS } from '@/mock/professionals'
import type { Professional } from '@/types/professional'

export const professionals: Array<{
  id: string
  name: string
  category: string
  rating: number
  jobsCompleted: number
  available: boolean
}> = PROFESSIONALS.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  rating: p.rating,
  jobsCompleted: p.completedJobs,
  available: p.isAvailable,
}))

import { listRequests } from '@/lib/data/request-store'
import type { ServiceRequest } from '@/types'

export const requests: ServiceRequest[] = listRequests().map((r) => ({
  id: r.id,
  title: r.title ?? r.description.slice(0, 40),
  description: r.description,
  status: r.status,
  customerName: r.customerName,
  professionalId: r.professionalId,
  address: r.location ?? '',
  createdAt: r.createdAt,
}))

export { PROFESSIONALS }
export type { Professional }
