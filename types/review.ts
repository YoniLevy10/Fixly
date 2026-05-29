export type Review = {
  id: string
  professionalId: string
  customerId: string | null
  rating: number
  text: string | null
  createdAt: string
  customerName?: string
}
