/** Central pricing — amounts in agorot (1 ILS = 100 agorot) */
export const monetizationConfig = {
  currency: 'ils' as const,
  /** Free tier: leads included per month (pilot) */
  freeLeadCreditsPerMonth: 3,
  /** Cost per lead when accepting a request without active Pro subscription */
  leadFeeAgorot: 1500, // 15 ₪
  /** Monthly Pro subscription */
  proSubscriptionAgorot: 14900, // 149 ₪
  /** Commission on completed paid jobs (basis points: 1000 = 10%) */
  commissionBasisPoints: 1000,
  tiers: {
    free: {
      id: 'free' as const,
      maxLeadsPerMonth: 3,
      featured: false,
    },
    pro: {
      id: 'pro' as const,
      maxLeadsPerMonth: null as number | null,
      featured: true,
    },
    pro_plus: {
      id: 'pro_plus' as const,
      maxLeadsPerMonth: null,
      featured: true,
    },
  },
} as const

export function agorotToIls(agorot: number): number {
  return agorot / 100
}

export function computeCommissionAgorot(quotedAmountIls: number): number {
  return Math.round(
    quotedAmountIls * 100 * (monetizationConfig.commissionBasisPoints / 10000)
  )
}
