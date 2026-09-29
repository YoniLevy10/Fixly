import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { isSupabaseEnabled } from '@/lib/data/config'
import { listRealProfessionalsForSeo } from '@/lib/data/professionals-service'

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
export async function resolveSeoIndexValue(options: {
  cityQuery: string
  categorySlug: string
}): Promise<SeoValueResult> {
  const realPros = await listRealProfessionalsForSeo({
    categorySlug: options.categorySlug,
    query: options.cityQuery,
  })
  if (realPros.length > 0) {
    return {
      hasValue: true,
      reason: 'pros',
      realProCount: realPros.length,
      waitlistDemandCount: 0,
    }
  }

  const demand = await countCustomerWaitlistForCity(options.cityQuery)
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
}

async function countCustomerWaitlistForCity(cityQuery: string): Promise<number> {
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
}
