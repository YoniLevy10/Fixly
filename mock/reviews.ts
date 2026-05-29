import type { Review } from '@/types/review'

const now = Date.now()

export const MOCK_REVIEWS: Review[] = [
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
  {
    id: 'rev-4',
    professionalId: '3',
    requestId: 'req-demo-5',
    customerName: 'דני פרץ',
    rating: 5,
    text: 'המזגן עובד מעולה אחרי התיקון.',
    createdAt: new Date(now - 86400000 * 7).toISOString(),
  },
  {
    id: 'rev-5',
    professionalId: '4',
    requestId: 'req-demo-15',
    customerName: 'יעל שמש',
    rating: 5,
    text: 'ניקיון יסודי, דירה מבריקה.',
    createdAt: new Date(now - 86400000 * 1).toISOString(),
  },
  {
    id: 'rev-6',
    professionalId: '1',
    requestId: 'req-demo-3',
    customerName: 'רון אבידן',
    rating: 4,
    text: 'פתר את הסתימה במהירות.',
    createdAt: new Date(now - 86400000 * 10).toISOString(),
  },
  {
    id: 'rev-7',
    professionalId: '6',
    requestId: 'req-demo-18',
    customerName: 'נועה בר',
    rating: 5,
    text: 'צביעה מדויקת, בלי לכלוך.',
    createdAt: new Date(now - 86400000 * 4).toISOString(),
  },
]

export function getReviewsByProfessionalId(professionalId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.professionalId === professionalId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
