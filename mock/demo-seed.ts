import type { Professional } from '@/types/professional'
import type { MockRequest } from '@/mock/requests'
import type { Review } from '@/types/review'
import type { RequestStatus } from '@/shared/constants/request-status'
import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
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
        // Roughly 1 in 3 demo pros carry Midrag verification for investor demos
        midragVerified: id % 3 === 1,
        midragRating: id % 3 === 1 ? round1(8.5 + (seed % 15) / 10) : null,
        midragReviewsCount: id % 3 === 1 ? 40 + (seed % 180) : undefined,
        midragProfileUrl:
          id % 3 === 1 ? `https://www.midrag.co.il/SpCard/Sp/${10000 + id}` : null,
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

  return canonicalizeDemoPro(pros)
}

/** Investor-demo face: id "1" is always יוסי כהן (matches claim / DEMO_PRO_USER). */
function canonicalizeDemoPro(pros: Professional[]): Professional[] {
  const plumbing = DEMO_CATEGORY_DEFS.find((d) => d.category === 'אינסטלציה')
  const idx = pros.findIndex((p) => p.id === DEMO_PROFESSIONAL_ID)
  if (idx < 0 || !plumbing) return pros

  const next = [...pros]
  next[idx] = {
    ...next[idx]!,
    name: 'יוסי כהן',
    title: 'אינסטלטור מוסמך · יוסי כהן',
    category: 'אינסטלציה',
    categories: ['אינסטלציה'],
    description:
      'אינסטלטור מוסמך עם 12 שנות ניסיון בתל אביב והמרכז — תיקונים דחופים, התקנות ושיפוצים. פרופיל הדגמה למשקיעים.',
    avatarUrl: pick(DEMO_AVATARS, 1),
    location: 'תל אביב',
    serviceAreas: ['תל אביב', 'רמת גן', 'גבעתיים', 'הרצליה'],
    phone: '050-1234567',
    rating: 4.9,
    reviewCount: 186,
    startingPrice: plumbing.basePrice,
    experienceYears: 12,
    completedJobs: 1240,
    isAvailable: true,
    isApproved: true,
    isFeatured: true,
    isVerified: true,
    midragVerified: true,
    midragRating: 9.4,
    midragReviewsCount: 214,
    midragProfileUrl: 'https://www.midrag.co.il/SpCard/Sp/10001',
    subscriptionTier: 'pro',
    availableHours: 'א׳-ה׳ 08:00-20:00 · שישי עד 14:00',
    gallery: [pick(DEMO_GALLERY, 2), pick(DEMO_GALLERY, 5)],
    services: plumbing.services.map((s) => ({ ...s })),
  }
  return next
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

    if (status === 'completed' || status === 'in_progress') {
      req.quotedAmount = 280 + (i % 8) * 45
      if (status === 'completed' && i % 3 !== 0) {
        req.paymentStatus = 'paid'
      }
    }

    requests.push(req)
  }

  // Dedicated rich inbox for יוסי כהן so the pro dashboard never looks empty.
  requests.push(...buildYossiInvestorJobs(pros))

  return requests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

const YOSSI_JOBS: Array<{
  status: RequestStatus
  title: string
  hoursAgo: number
  amount?: number
  paid?: boolean
}> = [
  { status: 'pending', title: 'סתימה בכיור מטבח', hoursAgo: 0.4 },
  { status: 'pending', title: 'ברז דולף בחדר רחצה', hoursAgo: 1.2 },
  { status: 'pending', title: 'החלפת אסלה תקועה', hoursAgo: 2.5 },
  { status: 'pending', title: 'דליפה מתחת לכיור', hoursAgo: 4 },
  { status: 'accepted', title: 'התקנת דוד שמש', hoursAgo: 3, amount: 890 },
  { status: 'accepted', title: 'תיקון לחץ מים נמוך', hoursAgo: 5, amount: 320 },
  { status: 'on_the_way', title: 'פיצוץ צינור בחניה', hoursAgo: 0.8, amount: 650 },
  { status: 'in_progress', title: 'החלפת סוללה במטבח', hoursAgo: 1.5, amount: 480 },
  { status: 'completed', title: 'תיקון ביוב סתום', hoursAgo: 28, amount: 720, paid: true },
  { status: 'completed', title: 'התקנת ברז גינה', hoursAgo: 52, amount: 350, paid: true },
  { status: 'completed', title: 'איטום מקלחון', hoursAgo: 76, amount: 1100, paid: true },
  { status: 'completed', title: 'החלפת משאבת מים', hoursAgo: 100, amount: 1450, paid: true },
  { status: 'completed', title: 'תיקון נזילה בתקרה', hoursAgo: 140, amount: 980, paid: true },
  { status: 'completed', title: 'פתיחת סתימה ראשית', hoursAgo: 180, amount: 560, paid: true },
  { status: 'completed', title: 'התקנת מסנן מים', hoursAgo: 220, amount: 420, paid: false },
]

function buildYossiInvestorJobs(pros: Professional[]): MockRequest[] {
  const yossi = pros.find((p) => p.id === DEMO_PROFESSIONAL_ID)
  if (!yossi) return []

  return YOSSI_JOBS.map((job, i) => {
    const street = pick(DEMO_STREETS, i + 40)
    const location = `תל אביב, ${street} ${12 + i * 3}`
    const coords = coordsFromLocationText(location)
    const liveActive =
      job.status === 'on_the_way' || job.status === 'in_progress'

    const req: MockRequest = {
      id: `req-yossi-${i + 1}`,
      customerId: `cust-yossi-${i + 1}`,
      customerName: customerName(i + 90),
      customerPhone: `050-${String(1000000 + i * 11111).slice(0, 7)}`,
      professionalId: DEMO_PROFESSIONAL_ID,
      professionalName: yossi.name,
      category: 'אינסטלציה',
      title: job.title,
      description: `${job.title} — הזמנת דמו למשקיעים אצל יוסי כהן`,
      status: job.status,
      createdAt: new Date(Date.now() - job.hoursAgo * 3600000).toISOString(),
      location,
      destinationLat: coords.lat,
      destinationLng: coords.lng,
      liveTrackingActive: liveActive,
      quotedAmount: job.amount,
      paymentStatus: job.paid ? 'paid' : job.amount ? 'pending' : undefined,
    }

    if (liveActive) {
      req.proLat = coords.lat + 0.018
      req.proLng = coords.lng + 0.012
      req.proLocationUpdatedAt = new Date().toISOString()
    }

    return req
  })
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
