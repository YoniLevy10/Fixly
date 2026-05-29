import type { Review } from '@/types/review'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { getDemoDataset } from '@/mock/demo-seed'

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

export const MOCK_REVIEWS: Review[] = isDemoDataMode()
  ? getDemoDataset().reviews
  : LEGACY_REVIEWS

export function getReviewsByProfessionalId(professionalId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.professionalId === professionalId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
