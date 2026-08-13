import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createBooking,
  getBooking,
  listBookings,
} from '@/lib/beauty/booking-store'

const createSchema = z.object({
  professionalId: z.string().min(1),
  professionalName: z.string().min(1),
  serviceName: z.string().min(1),
  servicePrice: z.number().positive(),
  platformFee: z.number().min(0),
  total: z.number().positive(),
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().min(7).max(20),
  address: z.string().min(3).max(200),
  placeType: z.enum(['home', 'hotel', 'office']),
  timeSlot: z.string().min(1),
  etaMinutes: z.number().int().positive().optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (id) {
    const booking = getBooking(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    return NextResponse.json(booking)
  }
  return NextResponse.json(listBookings())
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Demo payment: always succeeds after light validation
    const booking = createBooking({
      ...parsed.data,
      status: 'confirmed',
      paymentStatus: 'paid',
    })

    return NextResponse.json(booking, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת הזמנה' }, { status: 500 })
  }
}
