import {
  filterProfessionals,
  getApprovedProfessionals,
  getFeaturedProfessionals,
  getProfessionalById,
} from '@/mock/professionals'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import {
  supabaseGetFeaturedProfessionals,
  supabaseGetProfessionalById,
  supabaseListProfessionals,
} from '@/lib/data/supabase-professionals'
import type { Professional } from '@/types/professional'

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
    if (fromDb?.length) {
      let list = fromDb
      const { query, categorySlug, sortBy = 'rating' } = options ?? {}

      if (categorySlug) {
        const slugMap: Record<string, string[]> = {
          nails: ['מניקור', 'ציפורניים'],
          hair: ['תספורת', 'שיער', 'ספר'],
          makeup: ['איפור', 'מאפר'],
          plumbing: ['Plumber', 'אינסטל'],
          electricity: ['Electrician', 'חשמל'],
          ac: ['Air Conditioning', 'מיזוג'],
          cleaning: ['Cleaning', 'ניקיון'],
          painting: ['Painting', 'צבע'],
        }
        const names = slugMap[categorySlug] ?? []
        list = list.filter((p) =>
          names.some((n) => p.category.includes(n) || p.category.toLowerCase().includes(categorySlug))
        )
      }

      if (query?.trim()) {
        const q = query.trim().toLowerCase()
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
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
  }

  return []
}

export async function getFeaturedProfessionalsList(): Promise<Professional[]> {
  if (resolveDataBackend() === 'mock') {
    return getFeaturedProfessionals()
  }

  if (resolveDataBackend() === 'supabase') {
    const fromDb = await supabaseGetFeaturedProfessionals()
    if (fromDb?.length) return fromDb
  }

  return []
}

export async function getProfessional(id: string): Promise<Professional | undefined> {
  if (resolveDataBackend() === 'mock') {
    return getProfessionalById(id)
  }

  if (resolveDataBackend() === 'supabase') {
    const fromDb = await supabaseGetProfessionalById(id)
    if (fromDb) return fromDb
  }

  return undefined
}

export function listProfessionalsSync(): Professional[] {
  return getApprovedProfessionals()
}
