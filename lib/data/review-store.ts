import type { Review } from '@/types/review'
import { getMockReviews } from '@/mock/reviews'

let extras: Review[] = []

export function listDemoReviews(): Review[] {
  return [...extras, ...getMockReviews()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function listDemoReviewsByProfessional(professionalId: string): Review[] {
  return listDemoReviews().filter((r) => r.professionalId === professionalId)
}

export function createDemoReview(input: {
  requestId: string
  professionalId: string
  rating: number
  text?: string
  customerName?: string
}): Review {
  const review: Review = {
    id: `rev-live-${Date.now()}`,
    requestId: input.requestId,
    professionalId: input.professionalId,
    rating: input.rating,
    text: input.text?.trim() || null,
    customerName: input.customerName ?? 'אורח',
    createdAt: new Date().toISOString(),
  }
  extras = [review, ...extras]
  return review
}

/** Tests only */
export function resetDemoReviewStore(): void {
  extras = []
}
