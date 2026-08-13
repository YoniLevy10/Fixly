import type { Review } from '@/types/review'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { getDemoDataset } from '@/mock/demo-seed'
import { BEAUTY_PROFESSIONALS } from '@/mock/beauty-professionals'
import { DEMO_REVIEW_TEXTS, DEMO_FIRST_NAMES, DEMO_LAST_NAMES } from '@/mock/demo-catalog'

const now = Date.now()

const LEGACY_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    professionalId: '1',
    requestId: 'req-demo-1',
    customerName: 'מיכל כהן',
    rating: 5,
    text: 'הגיע מהר, תיקן את הברז ב-20 דקות. ממליץ בחום!',
    createdAt: new Date(now - 86400000 * 2).toISOString(),
  },
  {
    id: 'rev-2',
    professionalId: '1',
    requestId: 'req-demo-8',
    customerName: 'אבי לוי',
    rating: 5,
    text: 'מקצועי ואדיב, מחיר הוגן.',
    createdAt: new Date(now - 86400000 * 5).toISOString(),
  },
  {
    id: 'rev-3',
    professionalId: '2',
    requestId: 'req-demo-12',
    customerName: 'שרה גולן',
    rating: 4,
    text: 'עבודה טובה, קצת איחור של חצי שעה.',
    createdAt: new Date(now - 86400000 * 3).toISOString(),
  },
]

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
        rating: 4 + (seed % 2),
        text: DEMO_REVIEW_TEXTS[seed % DEMO_REVIEW_TEXTS.length]!,
        createdAt: new Date(now - 86400000 * (2 + (seed % 40))).toISOString(),
      })
    }
    n++
  }
  return reviews
}

const BEAUTY_REVIEWS = buildBeautyReviews()

export function getMockReviews(): Review[] {
  const base = isDemoDataMode() ? getDemoDataset().reviews : LEGACY_REVIEWS
  return [...BEAUTY_REVIEWS, ...base]
}

/** @deprecated Prefer getMockReviews() */
export const MOCK_REVIEWS: Review[] = getMockReviews()

export function getReviewsByProfessionalId(professionalId: string): Review[] {
  return getMockReviews()
    .filter((r) => r.professionalId === professionalId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

export function getReviewsForProfessional(professionalId: string): Review[] {
  return getReviewsByProfessionalId(professionalId)
}
