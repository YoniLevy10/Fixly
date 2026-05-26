export type UserRole = 'customer' | 'professional'

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Category {
  id: string
  name: string
  icon: string
  slug: string
}

export interface Professional {
  id: string
  name: string
  category: string
  rating: number
  jobsCompleted: number
  available: boolean
}

export interface ProfessionalDetailed {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  available: boolean
  verified: boolean
  estimatedPrice: number
  availabilityTime: string
  arrivalTime: string
  avatar?: string
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

export interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  isCenter?: boolean
}
