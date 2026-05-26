export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface ServiceRequest {
  id: string
  customerId: string
  professionalId?: string
  categoryId: string

  title: string
  description: string

  status: RequestStatus

  createdAt: string
  updatedAt: string
}
