export type UserRole = 'customer' | 'professional'

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'completed'
  | 'cancelled'

export interface Professional {
  id: string
  name: string
  category: string
  rating: number
  jobsCompleted: number
  available: boolean
}

export interface ServiceRequest {
  id: string
  title: string
  description: string
  status: RequestStatus
  customerName: string
  professionalId: string
  address: string
  createdAt: string
}
