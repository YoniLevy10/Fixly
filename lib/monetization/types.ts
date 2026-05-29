export type BillingEventType =
  | 'lead_charged'
  | 'lead_waived'
  | 'commission_accrued'
  | 'subscription_started'
  | 'subscription_renewed'

export type BillingEvent = {
  id: string
  professionalId: string
  requestId?: string
  eventType: BillingEventType
  amountAgorot: number
  currency: string
  metadata?: Record<string, unknown>
  createdAt: string
}
