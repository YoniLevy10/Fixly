import type { Professional } from '@/types/professional'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { BEAUTY_PROFESSIONALS } from '@/mock/beauty-professionals'

/** Glam MVP — beauty professionals are the primary dataset in demo mode */
const LEGACY_FALLBACK: Professional[] = BEAUTY_PROFESSIONALS

export function getProfessionals(): Professional[] {
  if (isDemoDataMode()) return BEAUTY_PROFESSIONALS
  return LEGACY_FALLBACK
}

export const PROFESSIONALS: Professional[] = BEAUTY_PROFESSIONALS

const SLUG_TO_CATEGORY: Record<string, string[]> = {
  nails: ['מניקור', 'ציפורניים'],
  hair: ['תספורת', 'שיער', 'ספר'],
  manicure: ['מניקור', 'ציפורניים'],
  barber: ['תספורת', 'ספר'],
  // keep a few legacy keys mapped so old links don't 404 empty
  cleaning: [],
  plumbing: [],
}

export function getFeaturedProfessionals(): Professional[] {
  return getProfessionals().filter((p) => p.isApproved && p.isFeatured)
}

export function getApprovedProfessionals(): Professional[] {
  return getProfessionals().filter((p) => p.isApproved)
}

export function getProfessionalById(id: string): Professional | undefined {
  return getProfessionals().find((p) => p.id === id)
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
        p.category.toLowerCase().includes(categorySlug) ||
        (categorySlug === 'nails' && p.category.includes('מניקור')) ||
        (categorySlug === 'hair' && p.category.includes('תספורת'))
    )
  }

  if (query?.trim()) {
    const q = query.trim().toLowerCase()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.services?.some((s) => s.name.toLowerCase().includes(q))
    )
  }

  return [...list].sort((a, b) => {
    if (sortBy === 'price') return a.startingPrice - b.startingPrice
    if (sortBy === 'jobs') return b.completedJobs - a.completedJobs
    return b.rating - a.rating
  })
}
