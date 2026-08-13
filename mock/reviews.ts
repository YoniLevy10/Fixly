import type { Review } from '@/types/review'
import { BEAUTY_PROFESSIONALS } from '@/mock/beauty-professionals'
import { DEMO_REVIEW_TEXTS, DEMO_FIRST_NAMES, DEMO_LAST_NAMES } from '@/mock/demo-catalog'

const now = Date.now()

function buildBeautyReviews(): Review[] {
  const reviews: Review[] = []
  let n = 0
  for (const pro of BEAUTY_PROFESSIONALS) {
    const count = 2 + (n % 3)
    for (let i = 0; i < count; i++) {
      const seed = n * 11 + i * 3
      reviews.push({
        id: `brev-${pro.id}-${i}`,
        professionalId: pro.id,
        requestId: `book-demo-${pro.id}-${i}`,
        customerName: `${DEMO_FIRST_NAMES[seed % DEMO_FIRST_NAMES.length]} ${DEMO_LAST_NAMES[(seed + 4) % DEMO_LAST_NAMES.length]}`,
        rating: (4 + (seed % 2)) as 4 | 5,
        text: DEMO_REVIEW_TEXTS[seed % DEMO_REVIEW_TEXTS.length]!,
        createdAt: new Date(now - 86400000 * (2 + seed % 40)).toISOString(),
      })
    }
    n++
  }
  return reviews
}

const BEAUTY_REVIEWS = buildBeautyReviews()

export function getMockReviews(): Review[] {
  return BEAUTY_REVIEWS
}

export function getReviewsForProfessional(professionalId: string): Review[] {
  return getMockReviews().filter((r) => r.professionalId === professionalId)
}
