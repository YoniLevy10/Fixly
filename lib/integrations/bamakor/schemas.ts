import { z } from 'zod'

export const externalRefSchema = z.object({
  system: z.string().trim().min(1).max(64),
  ticket_id: z.string().trim().min(1).max(128),
  ticket_number: z.coerce.number().int().optional().nullable(),
  client_id: z.string().trim().max(128).optional().nullable(),
  client_name: z.string().trim().max(200).optional().nullable(),
})

export const createJobSchema = z.object({
  source: z.enum(['bamakor', 'api', 'fixly']).default('bamakor'),
  external_ref: externalRefSchema.optional().nullable(),
  category: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  location: z.object({
    building_name: z.string().trim().max(200).optional().nullable(),
    address: z.string().trim().max(500).optional().nullable(),
    city: z.string().trim().min(1).max(100),
    lat: z.number().finite().min(-90).max(90).optional().nullable(),
    lng: z.number().finite().min(-180).max(180).optional().nullable(),
  }),
  contact: z
    .object({
      reporter_phone: z.string().trim().max(30).optional().nullable(),
      manager_phone: z.string().trim().max(30).optional().nullable(),
      notes: z.string().trim().max(2000).optional().nullable(),
    })
    .optional()
    .nullable(),
  media_urls: z.array(z.string().url()).max(20).default([]),
  assignment_mode: z
    .enum(['broadcast_first_accept', 'manual_select'])
    .default('broadcast_first_accept'),
  callback_url: z.string().url().max(2000).optional().nullable(),
})

export const updateJobStatusSchema = z.object({
  status: z.enum([
    'accepted',
    'en_route',
    'in_progress',
    'completed',
    'cancelled',
    'expired',
  ]),
  provider_id: z.string().uuid().optional(),
  note: z.string().trim().max(1000).optional(),
})

export const acceptOfferSchema = z.object({
  provider_id: z.string().uuid(),
})
