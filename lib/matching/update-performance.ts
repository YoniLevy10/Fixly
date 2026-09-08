import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  computePerformanceScore,
  priceFitScore,
} from '@/lib/matching/performance-score'
import { estimatePriceRange, guessCategorySlug } from '@/lib/estimate/price-estimate'

const REOPEN_WINDOW_DAYS = 14

/**
 * Recompute objective aggregates + performance_score for one professional.
 * Safe no-op without admin client.
 */
export async function refreshProfessionalPerformance(
  professionalId: string,
): Promise<number | null> {
  const supabase = getAdminSupabaseClient()
  if (!supabase) return null

  const { data: offeredRows } = await supabase
    .from('request_candidates')
    .select('status')
    .eq('professional_id', professionalId)

  const jobsOffered = offeredRows?.length ?? 0
  const jobsAccepted =
    offeredRows?.filter((r) => r.status === 'accepted').length ?? 0
  const acceptRate = jobsOffered > 0 ? jobsAccepted / jobsOffered : null

  const { data: completedJobs } = await supabase
    .from('requests')
    .select(
      'id, status, accepted_at, on_the_way_at, completed_at, quoted_amount, city, address, customer_id, category_id, service_categories ( slug, name, name_he )',
    )
    .eq('professional_id', professionalId)
    .eq('status', 'completed')

  const jobsCompleted = completedJobs?.length ?? 0

  let arrivalSum = 0
  let arrivalCount = 0
  let priceSum = 0
  let priceCount = 0
  let cleanCompletes = 0

  for (const job of completedJobs ?? []) {
    if (job.accepted_at && job.on_the_way_at) {
      const mins =
        (new Date(job.on_the_way_at as string).getTime() -
          new Date(job.accepted_at as string).getTime()) /
        60_000
      if (mins >= 0 && mins < 24 * 60) {
        arrivalSum += mins
        arrivalCount += 1
      }
    }

    const catRel = job.service_categories as
      | { slug?: string | null; name?: string | null; name_he?: string | null }
      | { slug?: string | null; name?: string | null; name_he?: string | null }[]
      | null
    const cat = Array.isArray(catRel) ? catRel[0] : catRel
    const slug =
      cat?.slug ||
      guessCategorySlug(cat?.name_he || cat?.name || '')
    const range = estimatePriceRange(slug)
    const mid = range ? (range.min + range.max) / 2 : null
    if (job.quoted_amount != null && mid != null) {
      priceSum += priceFitScore(Number(job.quoted_amount), mid)
      priceCount += 1
    }
    cleanCompletes += 1
  }

  // Reopens: completed job followed by another request same address/customer within window
  let reopenCount = 0
  for (const job of completedJobs ?? []) {
    if (!job.completed_at) continue
    const windowEnd = new Date(job.completed_at as string)
    windowEnd.setDate(windowEnd.getDate() + REOPEN_WINDOW_DAYS)

    let q = supabase
      .from('requests')
      .select('id')
      .neq('id', job.id as string)
      .gt('created_at', job.completed_at as string)
      .lte('created_at', windowEnd.toISOString())
      .limit(1)

    if (job.customer_id) {
      q = q.eq('customer_id', job.customer_id as string)
    } else if (job.address) {
      q = q.ilike('address', String(job.address))
    } else {
      continue
    }

    const { data: reopens } = await q
    if (reopens?.length) reopenCount += 1
  }

  const reopenRate = jobsCompleted > 0 ? reopenCount / jobsCompleted : null
  const avgArrivalMinutes = arrivalCount > 0 ? arrivalSum / arrivalCount : null
  const priceAccuracyScore = priceCount > 0 ? priceSum / priceCount : null
  const closeQualityScore =
    jobsCompleted > 0 ? (cleanCompletes / jobsCompleted) * 100 : null

  const { data: pro } = await supabase
    .from('professionals')
    .select('rating, avg_response_minutes')
    .eq('id', professionalId)
    .maybeSingle()

  const { score } = computePerformanceScore({
    acceptRate,
    avgResponseMinutes:
      pro?.avg_response_minutes != null ? Number(pro.avg_response_minutes) : null,
    avgArrivalMinutes,
    priceAccuracyScore,
    closeQualityScore,
    reopenRate,
    starRating: pro?.rating != null ? Number(pro.rating) : null,
    jobsCompleted,
  })

  await supabase
    .from('professionals')
    .update({
      jobs_completed: jobsCompleted,
      jobs_offered: jobsOffered,
      jobs_accepted: jobsAccepted,
      accept_rate: acceptRate,
      avg_arrival_minutes: avgArrivalMinutes,
      arrival_sample_count: arrivalCount,
      price_accuracy_score: priceAccuracyScore,
      reopen_rate: reopenRate,
      close_quality_score: closeQualityScore,
      performance_score: score,
      updated_at: new Date().toISOString(),
    })
    .eq('id', professionalId)

  return score
}
