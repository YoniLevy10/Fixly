import { z } from 'zod'

export const createRequestSchema = z
  .object({
    description: z.string().trim().min(3).max(5000),
    professionalId: z.string().trim().max(64).optional(),
    professionalName: z.string().trim().max(200).optional(),
    customerId: z.string().trim().max(64).optional(),
    customerName: z.string().trim().max(200).optional(),
    customerPhone: z.string().trim().max(30).optional(),
    category: z.string().trim().max(100).optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().trim().max(50).optional(),
    city: z.string().trim().max(100).optional(),
    title: z.string().trim().max(200).optional(),
    location: z.string().trim().max(500).optional(),
    preferredDate: z.string().trim().max(50).optional(),
    preferredTime: z.string().trim().max(50).optional(),
    images: z.array(z.string().url()).max(10).optional(),
    destinationLat: z.number().finite().optional(),
    destinationLng: z.number().finite().optional(),
    matchMode: z.boolean().optional(),
    referralCode: z.string().trim().max(50).optional(),
  })
  .refine((d) => Boolean(d.professionalId) || d.matchMode === true, {
    message: 'נדרש professionalId או matchMode',
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

export const updateRequestSchema = z.object({
  status: z.enum([
    'pending',
    'accepted',
    'on_the_way',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  quotedAmount: z.coerce.number().positive().max(1_000_000).optional(),
  cancellationReason: z.string().trim().max(1000).optional(),
})

export const waitlistAudienceSchema = z.enum(['customer', 'professional'])

export const waitlistAttributionSchema = z
  .object({
    utm_source: z.string().trim().max(200).optional(),
    utm_medium: z.string().trim().max(200).optional(),
    utm_campaign: z.string().trim().max(200).optional(),
    utm_content: z.string().trim().max(200).optional(),
    utm_term: z.string().trim().max(200).optional(),
  })
  .optional()

export const proWaitlistSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(7).max(30),
  email: z.union([z.string().trim().email().max(200), z.literal('')]).optional(),
  category: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  referralCode: z.string().trim().max(50).optional(),
  audience: waitlistAudienceSchema.optional().default('professional'),
  source: z.string().trim().max(100).optional(),
  attribution: waitlistAttributionSchema,
})

/** Alias for the unified pre-launch waitlist API */
export const waitlistSchema = proWaitlistSchema

export const proClaimSchema = z.object({
  professionalId: z.string().trim().uuid(),
})

export const locationUpdateSchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
})
