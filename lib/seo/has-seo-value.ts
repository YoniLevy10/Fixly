import { cache } from 'react'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isSupabaseEnabled } from '@/lib/data/config'
import { listRealProfessionalsForSeo } from '@/lib/data/professionals-service'
import { SEO_CATEGORIES, SEO_CITIES } from '@/lib/seo/marketplace-pages'

/** Min verified customer waitlist rows for a city before indexing without supply. */
export const SEO_WAITLIST_DEMAND_THRESHOLD = 3

export type SeoValueReason = 'pros' | 'waitlist_demand' | 'none'

export type SeoValueResult = {
  hasValue: boolean
  reason: SeoValueReason
  realProCount: number
  waitlistDemandCount: number
}

/**
 * Index city×category SEO pages only with real value:
 * - ≥1 real (non-demo) professional in city+category, or
 * - ≥3 customer waitlist signups for that city (verified demand).
 */
const resolveSeoIndexValueCached = cache(
  async (cityQuery: string, categorySlug: string): Promise<SeoValueResult> => {
  const realPros = await listRealProfessionalsForSeo({
    categorySlug,
    query: cityQuery,
  })
  if (realPros.length > 0) {
    return {
      hasValue: true,
      reason: 'pros',
      realProCount: realPros.length,
      waitlistDemandCount: 0,
    }
  }

  const demand = await countCustomerWaitlistForCity(cityQuery)
  if (demand >= SEO_WAITLIST_DEMAND_THRESHOLD) {
    return {
      hasValue: true,
      reason: 'waitlist_demand',
      realProCount: 0,
      waitlistDemandCount: demand,
    }
  }

  return {
    hasValue: false,
    reason: 'none',
    realProCount: 0,
    waitlistDemandCount: demand,
  }
})

export function resolveSeoIndexValue(options: {
  cityQuery: string
  categorySlug: string
}): Promise<SeoValueResult> {
  return resolveSeoIndexValueCached(options.cityQuery, options.categorySlug)
}

export async function categoryHasIndexablePair(categorySlug: string): Promise<boolean> {
  for (const city of SEO_CITIES) {
    const seo = await resolveSeoIndexValue({
      cityQuery: city.query,
      categorySlug,
    })
    if (seo.hasValue) return true
  }
  return false
}

export async function cityHasIndexablePair(cityQuery: string): Promise<boolean> {
  for (const category of SEO_CATEGORIES) {
    const seo = await resolveSeoIndexValue({
      cityQuery,
      categorySlug: category.slug,
    })
    if (seo.hasValue) return true
  }
  return false
}

/** Category hub: ≥1 approved pro in the trade, or any qualifying city×trade pair. */
export async function categoryHasAnyProfessional(categorySlug: string): Promise<boolean> {
  const pros = await listRealProfessionalsForSeo({ categorySlug })
  if (pros.some((p) => p.isApproved)) return true
  return categoryHasIndexablePair(categorySlug)
}

/** City hub: ≥1 approved pro in the city, or any qualifying city×trade pair. */
export async function cityHasAnyProfessional(cityQuery: string): Promise<boolean> {
  const pros = await listRealProfessionalsForSeo({ query: cityQuery })
  if (pros.some((p) => p.isApproved)) return true
  return cityHasIndexablePair(cityQuery)
}

const countCustomerWaitlistForCity = cache(async (cityQuery: string): Promise<number> => {
  const needle = cityQuery.trim()
  if (!needle || !isSupabaseEnabled()) return 0

  const admin = getAdminSupabaseClient()
  if (!admin) return 0

  const { count, error } = await admin
    .from('pro_waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('audience', 'customer')
    .ilike('city', `%${needle}%`)
    .not('source', 'ilike', '%smoke%')
    .not('source', 'ilike', '%test%')

  if (error) return 0
  return count ?? 0
})
