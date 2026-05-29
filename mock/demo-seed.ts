import type { Professional } from '@/types/professional'
import type { MockRequest } from '@/mock/requests'
import type { Review } from '@/types/review'
import type { RequestStatus } from '@/shared/constants/request-status'
import { coordsFromLocationText } from '@/lib/tracking/geo'
import {
  DEMO_AVATARS,
  DEMO_CATEGORY_DEFS,
  DEMO_CITIES,
  DEMO_FIRST_NAMES,
  DEMO_GALLERY,
  DEMO_LAST_NAMES,
  DEMO_REVIEW_TEXTS,
  DEMO_STREETS,
} from '@/mock/demo-catalog'

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]!
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function buildDemoProfessionals(): Professional[] {
  const pros: Professional[] = []
  let id = 1

  for (const def of DEMO_CATEGORY_DEFS) {
    for (let i = 0; i < def.count; i++) {
      const seed = id * 17 + i * 3
      const first = pick(DEMO_FIRST_NAMES, seed)
      const last = pick(DEMO_LAST_NAMES, seed + 5)
      const city = pick(DEMO_CITIES, seed + 11)
      const rating = round1(4.3 + ((seed % 8) + 1) * 0.1)
      const reviewCount = 28 + (seed % 220)
      const completedJobs = 120 + (seed % 1800)
      const isFeatured = id <= 6 || id % 5 === 0
      const isAvailable = id % 9 !== 0
      const experienceYears = 3 + (seed % 22)
      const gallery =
        id % 3 === 0
          ? [pick(DEMO_GALLERY, seed), pick(DEMO_GALLERY, seed + 1)]
          : id % 5 === 0
            ? [pick(DEMO_GALLERY, seed)]
            : []

      pros.push({
        id: String(id),
        name: `${first} ${last}`,
        title: pick(def.titleTemplates, seed),
        category: def.category,
        categories: [def.category],
        description: `${pick(def.titleTemplates, seed)} עם ${experienceYears} שנות ניסיון ב${def.category} — שירות ב${city} והסביבה`,
        avatarUrl: pick(DEMO_AVATARS, seed),
        location: city,
        serviceAreas: [
          city,
          pick(DEMO_CITIES, seed + 2),
          pick(DEMO_CITIES, seed + 4),
        ],
        phone: `05${(seed % 9) + 1}-${String(1000000 + (seed * 7919) % 9000000).slice(0, 7)}`,
        rating,
        reviewCount,
        startingPrice: def.basePrice + (seed % 4) * 25,
        experienceYears,
        completedJobs,
        isAvailable,
        isApproved: true,
        isFeatured,
        isVerified: rating >= 4.7 || id % 7 === 0,
        subscriptionTier: id % 4 === 0 ? 'pro' : id % 11 === 0 ? 'pro_plus' : 'free',
        availableHours: pick(
          ['א׳-ה׳ 08:00-20:00', 'א׳-ו׳ 07:00-19:00', '24/7 — מנעולנות', 'א׳-ה׳ 09:00-18:00'],
          seed
        ),
        gallery,
        services: def.services.map((s, j) => ({
          name: s.name,
          price: s.price + (j === 0 ? (seed % 3) * 20 : 0),
        })),
      })
      id++
    }
  }

  return pros
}

const STATUS_POOL: RequestStatus[] = [
  'pending',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'cancelled',
]

function statusForIndex(i: number): RequestStatus {
  const r = i % 20
  if (r < 3) return 'pending'
  if (r < 5) return 'accepted'
  if (r < 7) return 'on_the_way'
  if (r < 9) return 'in_progress'
  if (r < 18) return 'completed'
  return 'cancelled'
}

function customerName(i: number) {
  return `${pick(DEMO_FIRST_NAMES, i + 3)} ${pick(DEMO_LAST_NAMES, i + 7)}`
}

export function buildDemoRequests(pros: Professional[]): MockRequest[] {
  const requests: MockRequest[] = []
  const total = 120

  for (let i = 1; i <= total; i++) {
    const pro = pros[(i * 7) % pros.length]!
    const def = DEMO_CATEGORY_DEFS.find((d) => d.category === pro.category)!
    const status = statusForIndex(i)
    const hoursAgo = 0.5 + ((i * 5.7) % 720)
    const street = pick(DEMO_STREETS, i)
    const location = `${pro.location}, ${street} ${10 + (i % 90)}`
    const coords = coordsFromLocationText(location)
    const title = pick(def.jobTitles, i + pro.id.charCodeAt(0))
    const liveActive =
      (status === 'on_the_way' || status === 'in_progress') && i % 4 !== 0

    const req: MockRequest = {
      id: `req-demo-${i}`,
      customerId: i === 13 ? 'guest@fixly.app' : `cust-${i}`,
      customerName: i === 13 ? 'אורח' : customerName(i),
      customerPhone:
        i % 3 === 0 ? `05${(i % 9) + 2}-${String(1000000 + i * 12345).slice(0, 7)}` : undefined,
      professionalId: pro.id,
      professionalName: pro.name,
      category: pro.category,
      title,
      description: `${title} — ${pro.category}, דחיפות ${i % 5 === 0 ? 'גבוהה' : 'רגילה'}`,
      status,
      createdAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      location,
      destinationLat: coords.lat,
      destinationLng: coords.lng,
      liveTrackingActive: liveActive,
    }

    if (liveActive) {
      req.proLat = coords.lat + 0.02 + (i % 10) * 0.002
      req.proLng = coords.lng + 0.015
      req.proLocationUpdatedAt = new Date().toISOString()
    }

    if (status === 'cancelled') {
      req.cancellationReason = pick(
        ['נפתר עצמאית', 'מצאתי אחר', 'שינוי תוכניות', 'מחיר גבוה מדי'],
        i
      )
    }

    requests.push(req)
  }

  return requests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function buildDemoReviews(pros: Professional[]): Review[] {
  const reviews: Review[] = []
  let revId = 1
  const now = Date.now()

  for (const pro of pros) {
    const count = pro.isFeatured ? 6 : pro.reviewCount > 80 ? 4 : 2
    for (let j = 0; j < count; j++) {
      const seed = revId * 13 + Number(pro.id) * 3
      reviews.push({
        id: `rev-demo-${revId}`,
        professionalId: pro.id,
        requestId: `req-demo-${(seed % 120) + 1}`,
        customerName: customerName(seed),
        rating: j === 0 && pro.rating >= 4.8 ? 5 : 4 + (seed % 2),
        text: pick(DEMO_REVIEW_TEXTS, seed),
        createdAt: new Date(
          now - 86400000 * (1 + (seed % 90))
        ).toISOString(),
      })
      revId++
    }
  }

  return reviews.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export type DemoDataset = {
  professionals: Professional[]
  requests: MockRequest[]
  reviews: Review[]
}

let cached: DemoDataset | null = null

export function getDemoDataset(): DemoDataset {
  if (!cached) {
    const professionals = buildDemoProfessionals()
    const requests = buildDemoRequests(professionals)
    const reviews = buildDemoReviews(professionals)
    cached = { professionals, requests, reviews }
  }
  return cached
}

export function getDemoPlatformMetrics() {
  const { professionals, requests, reviews } = getDemoDataset()
  const completed = requests.filter((r) => r.status === 'completed').length
  const active = requests.filter((r) =>
    ['pending', 'accepted', 'on_the_way', 'in_progress'].includes(r.status)
  ).length
  const avgRating =
    professionals.reduce((s, p) => s + p.rating, 0) / professionals.length
  const totalJobs = professionals.reduce((s, p) => s + p.completedJobs, 0)

  return {
    professionals: professionals.length,
    requests: requests.length,
    reviews: reviews.length,
    activeRequests: active,
    completedRequests: completed,
    avgRating: round1(avgRating),
    totalCompletedJobs: totalJobs,
    featuredCount: professionals.filter((p) => p.isFeatured).length,
  }
}
