export type ProfessionalService = {
  name: string
  price: number
  description?: string
}

export type Professional = {
  id: string
  name: string
  title?: string
  category: string
  categories?: string[]
  description?: string
  longDescription?: string
  avatarUrl?: string
  gallery?: string[]
  location?: string
  serviceAreas?: string[]
  phone?: string
  rating: number
  reviewCount: number
  startingPrice: number
  services?: ProfessionalService[]
  availableHours?: string
  isAvailable: boolean
  isApproved: boolean
  isFeatured: boolean
  isVerified?: boolean
  experienceYears?: number
  completedJobs: number
  subscriptionTier?: 'free' | 'pro' | 'pro_plus'
}
