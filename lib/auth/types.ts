import { DEMO_PROFESSIONAL_ID, GUEST_USER_ID } from '@/lib/auth/constants'

export type UserRole = 'customer' | 'professional' | 'admin'

export type AppUser = {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  location?: string
  role: UserRole
  /** When role is professional, linked Supabase professional row id */
  professionalId?: string
}

export const GUEST_USER: AppUser = {
  id: GUEST_USER_ID,
  email: 'guest@fixly.app',
  fullName: 'אורח',
  phone: '',
  location: 'תל אביב-יפו',
  role: 'customer',
}

export const DEMO_PRO_USER: AppUser = {
  id: 'pro-demo',
  email: 'pro@fixly.app',
  fullName: 'יוסי כהן',
  phone: '050-1234567',
  location: 'תל אביב',
  role: 'professional',
  professionalId: DEMO_PROFESSIONAL_ID,
}
