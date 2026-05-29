export type Review = {
  id: string
  professionalId: string
  customerId?: string | null
  requestId?: string
  rating: number
  text: string | null
  createdAt: string
  customerName?: string
}
