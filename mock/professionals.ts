import type { Professional } from '@/types/professional'

/** Ported from BASE44 mockData.js — Hebrew professionals seed */
export const PROFESSIONALS: Professional[] = [
  {
    id: '1',
    name: 'יוסי כהן',
    title: 'אינסטלטור מוסמך',
    category: 'אינסטלציה',
    description: 'מעל 15 שנות ניסיון באינסטלציה ביתית ומסחרית',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    location: 'תל אביב',
    serviceAreas: ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק'],
    rating: 4.9,
    reviewCount: 127,
    startingPrice: 200,
    experienceYears: 15,
    completedJobs: 843,
    isAvailable: true,
    isApproved: true,
    isFeatured: true,
    availableHours: 'א׳-ה׳ 08:00-20:00',
    gallery: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop',
    ],
    services: [
      { name: 'תיקון ברז', price: 200 },
      { name: 'פתיחת סתימה', price: 350 },
      { name: 'החלפת מאגד', price: 450 },
    ],
  },
  {
    id: '2',
    name: 'דוד לוי',
    title: 'חשמלאי מוסמך',
    category: 'חשמל',
    description: 'חשמלאי מוסמך עם רישיון קבלן חשמל',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    location: 'ירושלים',
    serviceAreas: ['ירושלים', 'מבשרת ציון', 'בית שמש'],
    rating: 4.8,
    reviewCount: 89,
    startingPrice: 250,
    experienceYears: 12,
    completedJobs: 612,
    isAvailable: true,
    isApproved: true,
    isFeatured: false,
    availableHours: 'א׳-ו׳ 07:00-19:00',
    gallery: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop',
    ],
    services: [
      { name: 'התקנת שקע', price: 150 },
      { name: 'בדיקת לוח חשמל', price: 300 },
      { name: 'החלפת מפסק', price: 120 },
    ],
  },
  {
    id: '3',
    name: 'מוחמד עבאס',
    title: 'טכנאי מזגנים',
    category: 'מיזוג אוויר',
    description: 'מתמחה בהתקנה ותיקון מזגנים מכל הסוגים',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    location: 'חיפה',
    serviceAreas: ['חיפה', 'קריות', 'נשר', 'טירת כרמל'],
    rating: 4.7,
    reviewCount: 64,
    startingPrice: 300,
    experienceYears: 8,
    completedJobs: 445,
    isAvailable: true,
    isApproved: true,
    isFeatured: true,
    availableHours: 'א׳-ה׳ 09:00-18:00',
    gallery: [],
    services: [
      { name: 'התקנת מזגן', price: 800 },
      { name: 'תיקון תקלה', price: 350 },
      { name: 'ניקוי מזגן', price: 200 },
    ],
  },
  {
    id: '4',
    name: 'רחל גרין',
    title: 'מנקה מקצועית',
    category: 'ניקיון',
    description: 'שירות ניקיון יסודי לדירות, בתים ומשרדים',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    location: 'תל אביב',
    serviceAreas: ['תל אביב', 'הרצליה', 'רעננה', 'כפר סבא'],
    rating: 5.0,
    reviewCount: 203,
    startingPrice: 150,
    experienceYears: 7,
    completedJobs: 1240,
    isAvailable: false,
    isApproved: true,
    isFeatured: true,
    availableHours: 'א׳-ה׳ 08:00-17:00',
    gallery: [],
    services: [
      { name: 'ניקיון דירה 3 חד׳', price: 350 },
      { name: 'ניקיון אחרי שיפוץ', price: 600 },
      { name: 'ניקיון משרד', price: 200 },
    ],
  },
  {
    id: '5',
    name: 'אמיר שלמה',
    title: 'נגר מוסמך',
    category: 'נגרות',
    description: 'עיצוב ובניית ריהוט מותאם אישית',
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    location: 'באר שבע',
    serviceAreas: ['באר שבע', 'נתיבות', 'אשדוד', 'אשקלון'],
    rating: 4.6,
    reviewCount: 48,
    startingPrice: 400,
    experienceYears: 20,
    completedJobs: 378,
    isAvailable: true,
    isApproved: true,
    isFeatured: false,
    availableHours: 'א׳-ה׳ 08:00-17:00',
    gallery: [],
    services: [
      { name: 'ארון מותאם', price: 2500 },
      { name: 'שולחן עבודה', price: 1200 },
      { name: 'תיקון ריהוט', price: 300 },
    ],
  },
  {
    id: '6',
    name: 'ניר אברהם',
    title: 'צבעי מקצועי',
    category: 'צביעה',
    description: 'צביעה פנים וחוץ, גמר מושלם',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    location: 'פתח תקווה',
    serviceAreas: ['פתח תקווה', 'ראש העין', 'לוד', 'רמלה'],
    rating: 4.5,
    reviewCount: 72,
    startingPrice: 180,
    experienceYears: 10,
    completedJobs: 567,
    isAvailable: true,
    isApproved: true,
    isFeatured: false,
    availableHours: 'א׳-ו׳ 07:00-18:00',
    gallery: [],
    services: [
      { name: 'צביעת חדר', price: 400 },
      { name: 'צביעת דירה 4 חד׳', price: 2200 },
      { name: 'טיח + צבע', price: 3000 },
    ],
  },
]

const SLUG_TO_CATEGORY: Record<string, string[]> = {
  plumbing: ['אינסטלציה', 'אינסטלטור'],
  electricity: ['חשמל', 'חשמלאי'],
  ac: ['מיזוג אוויר'],
  cleaning: ['ניקיון'],
  carpentry: ['נגרות'],
  painting: ['צביעה', 'צבעי'],
  gardening: ['גינון'],
  locksmith: ['מנעולן'],
  tiling: ['ריצוף'],
  moving: ['הובלות'],
}

export function getFeaturedProfessionals(): Professional[] {
  return PROFESSIONALS.filter((p) => p.isApproved && p.isFeatured)
}

export function getApprovedProfessionals(): Professional[] {
  return PROFESSIONALS.filter((p) => p.isApproved)
}

export function getProfessionalById(id: string): Professional | undefined {
  return PROFESSIONALS.find((p) => p.id === id)
}

export function filterProfessionals(options: {
  query?: string
  categorySlug?: string
  sortBy?: 'rating' | 'price' | 'jobs'
}): Professional[] {
  let list = getApprovedProfessionals()
  const { query, categorySlug, sortBy = 'rating' } = options

  if (categorySlug) {
    const names = SLUG_TO_CATEGORY[categorySlug] ?? []
    list = list.filter(
      (p) =>
        names.some((n) => p.category.includes(n)) ||
        p.category.toLowerCase().includes(categorySlug)
    )
  }

  if (query?.trim()) {
    const q = query.trim().toLowerCase()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
    )
  }

  return [...list].sort((a, b) => {
    if (sortBy === 'price') return a.startingPrice - b.startingPrice
    if (sortBy === 'jobs') return b.completedJobs - a.completedJobs
    return b.rating - a.rating
  })
}
