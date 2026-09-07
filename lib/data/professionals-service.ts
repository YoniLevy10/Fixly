import {
  filterProfessionals,
  getApprovedProfessionals,
  getFeaturedProfessionals,
  getProfessionalById,
} from '@/mock/professionals'
import { BEAUTY_PROFESSIONALS } from '@/mock/beauty-professionals'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import {
  supabaseGetFeaturedProfessionals,
  supabaseGetProfessionalById,
  supabaseListProfessionals,
} from '@/lib/data/supabase-professionals'
import type { Professional } from '@/types/professional'

/**
 * Curated beauty providers live in mock until claimed in Supabase.
 * Layer them onto DB results so nails/hair/makeup search is never empty
 * while the beauty vertical is still bootstrapping.
 */
export function withCuratedProfessionals(list: Professional[]): Professional[] {
  const ids = new Set(list.map((p) => p.id))
  const extras = BEAUTY_PROFESSIONALS.filter((p) => !ids.has(p.id))
  return extras.length ? [...extras, ...list] : list
}

function applyListOptions(
  list: Professional[],
  options?: {
    query?: string
    categorySlug?: string
    sortBy?: 'rating' | 'price' | 'jobs'
  }
): Professional[] {
  let next = list
  const { query, categorySlug, sortBy = 'rating' } = options ?? {}

  if (categorySlug) {
    const slugMap: Record<string, string[]> = {
      nails: ['מניקור', 'ציפורניים'],
      hair: ['תספורת', 'שיער', 'ספר'],
      makeup: ['איפור', 'מאפר'],
      manicure: ['מניקור', 'ציפורניים'],
      barber: ['תספורת', 'ספר'],
      plumbing: ['Plumber', 'אינסטל'],
      electricity: ['Electrician', 'חשמל'],
      ac: ['Air Conditioning', 'מיזוג'],
      cleaning: ['Cleaning', 'ניקיון'],
      painting: ['Painting', 'צבע'],
      gardening: ['גינון'],
      locksmith: ['מנעול'],
      carpentry: ['נגר'],
      tiling: ['ריצוף'],
      moving: ['הובל'],
      elevators: ['מעלית', 'מעליות'],
      pest_control: ['הדברה', 'מדביר'],
      furniture: ['ריהוט', 'רהיט'],
      appliance_repair: ['מכשיר', 'כביסה', 'מקרר', 'מדיח'],
      computers: ['מחשב', 'IT'],
      glazing: ['זגג', 'זכוכית', 'חלון'],
      renovations: ['שיפוץ', 'שיפוצים'],
      waterproofing: ['איטום', 'רטיבות'],
      aluminum: ['אלומיניום', 'תריס', 'פרגולה'],
      drywall: ['גבס', 'טיח'],
      solar: ['סולאר', 'שמש', 'קולט'],
      general: ['כללי', 'אחר', 'תיקון'],
    }
    const names = slugMap[categorySlug] ?? []
    next = next.filter((p) =>
      names.some(
        (n) =>
          p.category.includes(n) ||
          p.category.toLowerCase().includes(categorySlug)
      )
    )
  }

  if (query?.trim()) {
    const q = query.trim().toLowerCase()
    next = next.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
    )
  }

  return [...next].sort((a, b) => {
    if (sortBy === 'price') return a.startingPrice - b.startingPrice
    if (sortBy === 'jobs') return b.completedJobs - a.completedJobs
    return b.rating - a.rating
  })
}

export async function listProfessionals(options?: {
  query?: string
  categorySlug?: string
  sortBy?: 'rating' | 'price' | 'jobs'
}): Promise<Professional[]> {
  if (resolveDataBackend() === 'mock') {
    return filterProfessionals(options ?? {})
  }

  if (resolveDataBackend() === 'supabase') {
    const fromDb = await supabaseListProfessionals()
    if (fromDb) {
      return applyListOptions(withCuratedProfessionals(fromDb), options)
    }
    // Query failure (e.g. schema drift) — keep marketplace usable with curated catalog
    return filterProfessionals(options ?? {})
  }

  return filterProfessionals(options ?? {})
}

export async function getFeaturedProfessionalsList(): Promise<Professional[]> {
  if (resolveDataBackend() === 'mock') {
    return getFeaturedProfessionals()
  }

  if (resolveDataBackend() === 'supabase') {
    const fromDb = await supabaseGetFeaturedProfessionals()
    if (fromDb) {
      const merged = withCuratedProfessionals(fromDb)
      return merged.filter((p) => p.isFeatured && p.isAvailable).slice(0, 8)
    }
    return getFeaturedProfessionals()
  }

  return getFeaturedProfessionals()
}

export async function getProfessional(id: string): Promise<Professional | undefined> {
  if (resolveDataBackend() === 'mock') {
    return getProfessionalById(id)
  }

  if (resolveDataBackend() === 'supabase') {
    const fromDb = await supabaseGetProfessionalById(id)
    if (fromDb) return fromDb
    // Curated beauty ids (b1…) are not in Supabase yet
    return getProfessionalById(id)
  }

  return getProfessionalById(id)
}

export function listProfessionalsSync(): Professional[] {
  return getApprovedProfessionals()
}
