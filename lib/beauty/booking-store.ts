export type BeautyBooking = {
  id: string
  professionalId: string
  professionalName: string
  serviceName: string
  servicePrice: number
  platformFee: number
  total: number
  customerName: string
  customerPhone: string
  address: string
  placeType: 'home' | 'hotel' | 'office'
  timeSlot: string
  etaMinutes?: number
  status: 'confirmed' | 'on_the_way' | 'completed' | 'cancelled'
  paymentStatus: 'paid' | 'pending' | 'refunded'
  createdAt: string
}

const globalStore = globalThis as typeof globalThis & {
  __glamBookings?: BeautyBooking[]
}

function store(): BeautyBooking[] {
  if (!globalStore.__glamBookings) globalStore.__glamBookings = []
  return globalStore.__glamBookings
}

export function createBooking(
  input: Omit<BeautyBooking, 'id' | 'createdAt'>
): BeautyBooking {
  const booking: BeautyBooking = {
    ...input,
    id: `glam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
  store().unshift(booking)
  return booking
}

export function getBooking(id: string): BeautyBooking | undefined {
  return store().find((b) => b.id === id)
}

export function listBookings(): BeautyBooking[] {
  return [...store()]
}
