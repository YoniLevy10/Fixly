import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { upsertRequest, getRequestById } from '@/lib/data/request-store'
import type { MockRequest } from '@/mock/requests'

const STATUS_VALUES = [
  'pending',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'cancelled',
] as const

/**
 * Durable demo upsert — any Vercel isolate can accept the client snapshot.
 * Required because the in-memory mock store is not shared across instances.
 */
const demoRequestSchema = z.object({
  id: z.string().trim().min(1).max(64),
  customerId: z.string().trim().min(1).max(64),
  customerName: z.string().trim().min(1).max(200),
  customerPhone: z.string().trim().max(30).optional(),
  professionalId: z.string().trim().max(64),
  professionalName: z.string().trim().max(200),
  category: z.string().trim().max(100),
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().min(1).max(5000),
  status: z.enum(STATUS_VALUES),
  createdAt: z.string().trim().min(1),
  location: z.string().trim().max(500).optional(),
  destinationLat: z.number().finite().optional(),
  destinationLng: z.number().finite().optional(),
  proLat: z.number().finite().optional(),
  proLng: z.number().finite().optional(),
  proLocationUpdatedAt: z.string().optional(),
  liveTrackingActive: z.boolean().optional(),
  matchMode: z.enum(['single', 'multi']).optional(),
})

export async function PUT(request: Request) {
  if (!isDemoDataMode()) {
    return NextResponse.json({ error: 'Demo mode off' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = demoRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'נתונים לא תקינים', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const saved = upsertRequest(parsed.data as MockRequest)
  return NextResponse.json(saved)
}

export async function GET(request: Request) {
  if (!isDemoDataMode()) {
    return NextResponse.json({ error: 'Demo mode off' }, { status: 403 })
  }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  const found = getRequestById(id)
  if (!found) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }
  return NextResponse.json(found)
}
