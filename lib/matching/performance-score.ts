/**
 * Objective performance scoring for Fixly matching.
 * Stars are a secondary signal — see docs/DIFFERENTIATION.md
 */

export type PerformanceInputs = {
  acceptRate: number | null // 0–1
  avgResponseMinutes: number | null
  avgArrivalMinutes: number | null
  priceAccuracyScore: number | null // 0–100
  closeQualityScore: number | null // 0–100
  reopenRate: number | null // 0–1 (lower is better)
  starRating: number | null // 0–5
  jobsCompleted: number
}

export type PerformanceBreakdown = {
  score: number
  components: {
    accept: number
    response: number
    arrival: number
    price: number
    close: number
    reopen: number
    stars: number
  }
}

const WEIGHTS = {
  accept: 20,
  response: 15,
  arrival: 15,
  price: 15,
  close: 20,
  reopen: 10,
  stars: 5,
} as const

/** Map minutes to 0–100 (faster = better). Caps at 120 minutes. */
export function minutesToScore(minutes: number | null | undefined, ideal = 15, worst = 120): number {
  if (minutes == null || Number.isNaN(minutes) || minutes < 0) return 50
  if (minutes <= ideal) return 100
  if (minutes >= worst) return 0
  return Math.round(100 * (1 - (minutes - ideal) / (worst - ideal)))
}

export function rateToScore(rate: number | null | undefined): number {
  if (rate == null || Number.isNaN(rate)) return 50
  return Math.round(Math.min(1, Math.max(0, rate)) * 100)
}

/** Lower reopen rate is better. */
export function reopenToScore(reopenRate: number | null | undefined): number {
  if (reopenRate == null || Number.isNaN(reopenRate)) return 50
  return Math.round((1 - Math.min(1, Math.max(0, reopenRate))) * 100)
}

export function starsToScore(rating: number | null | undefined): number {
  if (rating == null || Number.isNaN(rating)) return 50
  return Math.round((Math.min(5, Math.max(0, rating)) / 5) * 100)
}

/**
 * Price fit: hourly price vs category estimate midpoint.
 * Within ±20% of mid → 100; beyond ±80% → 0.
 */
export function priceFitScore(
  hourlyPrice: number | null | undefined,
  estimateMid: number | null | undefined,
): number {
  if (hourlyPrice == null || estimateMid == null || estimateMid <= 0) return 50
  const ratio = hourlyPrice / estimateMid
  const drift = Math.abs(ratio - 1)
  if (drift <= 0.2) return 100
  if (drift >= 0.8) return 0
  return Math.round(100 * (1 - (drift - 0.2) / 0.6))
}

export function computePerformanceScore(input: PerformanceInputs): PerformanceBreakdown {
  const components = {
    accept: rateToScore(input.acceptRate),
    response: minutesToScore(input.avgResponseMinutes, 10, 90),
    arrival: minutesToScore(input.avgArrivalMinutes, 30, 180),
    price: input.priceAccuracyScore != null ? clamp100(input.priceAccuracyScore) : 50,
    close: input.closeQualityScore != null ? clamp100(input.closeQualityScore) : 50,
    reopen: reopenToScore(input.reopenRate),
    stars: starsToScore(input.starRating),
  }

  // Cold start: few/no completed jobs → pull toward neutral 50
  const coldFactor = Math.min(1, input.jobsCompleted / 5)

  let weighted =
    (components.accept * WEIGHTS.accept +
      components.response * WEIGHTS.response +
      components.arrival * WEIGHTS.arrival +
      components.price * WEIGHTS.price +
      components.close * WEIGHTS.close +
      components.reopen * WEIGHTS.reopen +
      components.stars * WEIGHTS.stars) /
    100

  weighted = 50 * (1 - coldFactor) + weighted * coldFactor

  return {
    score: Math.round(clamp100(weighted) * 100) / 100,
    components,
  }
}

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, n))
}

export type RankableCandidate = {
  professionalId: string
  name: string
  rating: number
  isVerified: boolean
  available: boolean
  avgResponseMinutes: number | null
  hourlyPrice: number | null
  performanceScore: number
  acceptRate: number | null
  city: string | null
  categoryId: string | null
}

/**
 * Sort for matching: performance → verified → response → stars.
 * Callers should already filter by category/city/availability.
 */
export function rankCandidates(
  candidates: RankableCandidate[],
  opts?: { estimateMid?: number | null },
): RankableCandidate[] {
  const mid = opts?.estimateMid ?? null
  return [...candidates].sort((a, b) => {
    const priceA = priceFitScore(a.hourlyPrice, mid)
    const priceB = priceFitScore(b.hourlyPrice, mid)
    // Blend stored performance with live price fit for this job
    const scoreA = a.performanceScore * 0.85 + priceA * 0.15
    const scoreB = b.performanceScore * 0.85 + priceB * 0.15
    if (scoreB !== scoreA) return scoreB - scoreA
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1
    const respA = a.avgResponseMinutes ?? 9999
    const respB = b.avgResponseMinutes ?? 9999
    if (respA !== respB) return respA - respB
    return b.rating - a.rating
  })
}
