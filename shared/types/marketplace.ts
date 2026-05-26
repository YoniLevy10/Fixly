export interface UserProfile {
  id: string
  fullName: string
  phone?: string
  avatarUrl?: string
  role: 'customer' | 'professional' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Professional {
  id: string
  userId: string
  categoryId: string
  displayName: string
  bio?: string
  city?: string
  ratingAverage: number
  reviewCount: number
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  requestId: string
  customerId: string
  professionalId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface ImageAsset {
  id: string
  ownerType: 'professional' | 'request' | 'review'
  ownerId: string
  url: string
  alt?: string
  sortOrder: number
  createdAt: string
}
