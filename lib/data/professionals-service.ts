import {
  filterProfessionals,
  getApprovedProfessionals,
  getFeaturedProfessionals,
  getProfessionalById,
  getProfessionals,
} from '@/mock/professionals'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { isMockCatalogEnabled } from '@/lib/data/mock-catalog'
import { isSeedDemoProfessionalId } from '@/lib/data/seed-professionals'
import {
  supabaseGetFeaturedProfessionals,
  supabaseGetProfessionalById,
  supabaseListProfessionals,
} from '@/lib/data/supabase-professionals'
import type { Professional } from '@/types/professional'

/** Identity helper kept for call sites / tests — no curated overlay. */
export function withCuratedProfessionals(list: Professional[]): Professional[] {
  return list
}

function mergeCatalog(
  fromDb: Professional[],
  mockList: Professional[],
): Professional[] {
  const byId = new Map<string, Professional>()
  // Mock fills the marketplace; real claimed Pros win on id collision
  for (const p of mockList) byId.set(p.id, p)
  for (const p of fromDb) byId.set(p.id, p)
  return Array.from(byId.values())
}

function applyListOptions(
  list: Professional[],
  options?: {
    query?: string
    categorySlug?: string
    sortBy?: 'rating' | 'price' | 'jobs' | 'performance'
  }
): Professional[] {
  let next = list
  const { query, categorySlug, sortBy = 'performance' } = options ?? {}

  if (categorySlug) {
    const slugMap: Record<string, string[]> = {
      plumbing: ['Plumber', 'אינסטל'],
      electricity: ['Electrician', 'חשמל'],
      ac: ['Air Conditioning', 'מיזוג'],
      cleaning: ['Cleaning', 'ניקיון'],
      painting: ['Painting', 'צבע'],
      gardening: ['גינון'],
      locksmith: ['מנעול'],
      carpentry: ['נגר'],
      tiling: ['ריצוף', 'קרמיקה'],
      moving: ['הובל'],
      elevators: ['מעלית', 'מעליות'],
      pest_control: ['הדברה', 'מדביר'],
      furniture: ['ריהוט', 'רהיט'],
      appliance_repair: ['מכשיר', 'כביסה', 'מקרר', 'מדיח'],
      appliances: ['מכשיר', 'כביסה', 'מקרר'],
      phone_repair: ['סמארטפון', 'אייפון', 'טלפון'],
      glazing: ['זגג', 'זכוכית', 'חלון'],
      renovations: ['שיפוץ', 'שיפוצים'],
      handyman: ['שיפוצים קטנים', 'הנדימן', 'תיקונים קטנים'],
      waterproofing: ['איטום', 'רטיבות'],
      aluminum: ['אלומיניום', 'תריס', 'פרגולה'],
      drywall: ['גבס', 'טיח'],
      solar: ['דוד שמש', 'דודי שמש', 'שמש', 'קולט'],
      general: ['כללי', 'אחר', 'תיקון'],
    }
    const names = slugMap[categorySlug] ?? [categorySlug]
    next = next.filter((p) => {
      const hay = [
        p.category,
        p.title ?? '',
        ...(p.categories ?? []),
      ]
        .join(' ')
        .toLowerCase()
      if (hay.includes(categorySlug.toLowerCase())) return true
      return names.some((n) => hay.includes(n.toLowerCase()))
    })
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
    if (sortBy === 'rating') return b.rating - a.rating
    return (b.performanceScore ?? 50) - (a.performanceScore ?? 50)
  })
}

export async function listProfessionals(options?: {
  query?: string
  categorySlug?: string
  sortBy?: 'rating' | 'price' | 'jobs' | 'performance'
}): Promise<Professional[]> {
  if (resolveDataBackend() === 'mock') {
    return filterProfessionals(options ?? {})
  }

  if (resolveDataBackend() === 'supabase') {
    const fromDb = (await supabaseListProfessionals()) ?? []
    if (isMockCatalogEnabled()) {
      return applyListOptions(
        mergeCatalog(fromDb, getProfessionals()),
        options,
      )
    }
    if (fromDb.length > 0) {
      return applyListOptions(withCuratedProfessionals(fromDb), options)
    }
    return filterProfessionals(options ?? {})
  }

  return filterProfessionals(options ?? {})
}

/**
 * Organic / SEO pages only — real Supabase professionals, excluding seed demos
 * and never merging the mock catalog. Empty means the page should noindex.
 */
export async function listRealProfessionalsForSeo(options?: {
  query?: string
  categorySlug?: string
}): Promise<Professional[]> {
  if (resolveDataBackend() !== 'supabase') return []
  const fromDb = (await supabaseListProfessionals()) ?? []
  const real = fromDb.filter((p) => !isSeedDemoProfessionalId(p.id))
  return applyListOptions(real, options)
}

export async function getFeaturedProfessionalsList(): Promise<Professional[]> {
  if (resolveDataBackend() === 'mock') {
    return getFeaturedProfessionals()
  }

  if (resolveDataBackend() === 'supabase') {
    const fromDb = (await supabaseGetFeaturedProfessionals()) ?? []
    if (isMockCatalogEnabled()) {
      const merged = mergeCatalog(fromDb, getProfessionals())
      const featured = merged.filter((p) => p.isFeatured && p.isAvailable)
      return featured.slice(0, 8)
    }
    if (fromDb.length > 0) {
      return withCuratedProfessionals(fromDb)
        .filter((p) => p.isFeatured && p.isAvailable)
        .slice(0, 8)
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
    if (isMockCatalogEnabled()) return getProfessionalById(id)
    return undefined
  }

  return getProfessionalById(id)
}

export function listProfessionalsSync(): Professional[] {
  return getApprovedProfessionals()
}
