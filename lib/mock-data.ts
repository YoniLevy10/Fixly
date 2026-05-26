import { Professional, ServiceRequest, Category, ProfessionalDetailed } from '@/types'

export const categories: Category[] = [
  { id: '1', name: 'חשמלאי', icon: '/icons/electrician.png', slug: 'electrician' },
  { id: '2', name: 'אינסטלטור', icon: '/icons/plumber.png', slug: 'plumber' },
  { id: '3', name: 'מיזוג אוויר', icon: '/icons/ac.png', slug: 'ac' },
  { id: '4', name: 'מנעולן', icon: '/icons/locksmith.png', slug: 'locksmith' },
  { id: '5', name: 'צבעי', icon: '/icons/painter.png', slug: 'painter' },
  { id: '6', name: 'תיקון מכשירי חשמל', icon: '/icons/appliance.png', slug: 'appliance' },
  { id: '7', name: 'התקנת טלוויזיה', icon: '/icons/tv.png', slug: 'tv' },
  { id: '8', name: 'נגרות והרכבות', icon: '/icons/carpentry.png', slug: 'carpentry' },
  { id: '9', name: 'ניקיון', icon: '/icons/cleaning.png', slug: 'cleaning' },
]

export const professionals: Professional[] = [
  {
    id: '1',
    name: 'אבי לוי',
    category: 'חשמלאי',
    rating: 4.9,
    jobsCompleted: 96,
    available: true,
  },
  {
    id: '2',
    name: 'יוסי כהן',
    category: 'אינסטלטור',
    rating: 4.8,
    jobsCompleted: 128,
    available: true,
  },
  {
    id: '3',
    name: 'מיכאל דוד',
    category: 'מיזוג אוויר',
    rating: 4.7,
    jobsCompleted: 74,
    available: true,
  },
]

export const professionalsDetailed: ProfessionalDetailed[] = [
  {
    id: '1',
    name: 'אבי אינסטלציה',
    category: 'אינסטלטור מוסמך',
    rating: 4.8,
    reviewCount: 125,
    available: true,
    verified: true,
    estimatedPrice: 250,
    availabilityTime: '12:00-18:00',
    arrivalTime: '60-90',
    avatar: '/avatars/avi.jpg',
  },
  {
    id: '2',
    name: 'רוני פתרונות',
    category: 'אינסטלטור',
    rating: 4.6,
    reviewCount: 98,
    available: true,
    verified: true,
    estimatedPrice: 300,
    availabilityTime: '10:00-16:00',
    arrivalTime: '30-60',
    avatar: '/avatars/roni.jpg',
  },
  {
    id: '3',
    name: 'דוד אינסטלציה',
    category: 'אינסטלטור מוסמך',
    rating: 4.4,
    reviewCount: 76,
    available: false,
    verified: true,
    estimatedPrice: 280,
    availabilityTime: '09:00-14:00',
    arrivalTime: '60-120',
    avatar: '/avatars/david.jpg',
  },
]

export const requests: ServiceRequest[] = [
  {
    id: '1',
    title: 'תיקון חשמל במטבח',
    description: 'האורות במטבח לא עובדים',
    status: 'on_the_way',
    customerName: 'שרה כהן',
    professionalId: '1',
    address: 'תל אביב',
    createdAt: new Date().toISOString(),
  },
]

export const filters = [
  { id: 'availability', label: 'זמינות', active: true },
  { id: 'rating', label: 'דירוג', active: false },
  { id: 'price', label: 'הצעת מחיר', active: false },
  { id: 'filter', label: 'סינון', active: false },
]
