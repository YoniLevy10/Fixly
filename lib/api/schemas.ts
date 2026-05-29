import { z } from 'zod'

export const createRequestSchema = z.object({
  description: z.string().trim().min(3).max(5000),
  professionalId: z.string().trim().min(1).max(64),
  professionalName: z.string().trim().max(200).optional(),
  customerId: z.string().trim().max(64).optional(),
  customerName: z.string().trim().max(200).optional(),
  customerPhone: z.string().trim().max(30).optional(),
  category: z.string().trim().max(100).optional(),
  title: z.string().trim().max(200).optional(),
  location: z.string().trim().max(500).optional(),
  preferredDate: z.string().trim().max(50).optional(),
  preferredTime: z.string().trim().max(50).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  destinationLat: z.number().finite().optional(),
  destinationLng: z.number().finite().optional(),
})

export const createReviewSchema = z.object({
  requestId: z.string().trim().min(1).max(64),
  professionalId: z.string().trim().min(1).max(64),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(2000).optional(),
})

/** Checkout has no body today; reject unexpected fields. */
export const billingCheckoutSchema = z.object({}).strict()

export const stripeWebhookEventSchema = z.object({
  type: z.string().min(1),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
})
