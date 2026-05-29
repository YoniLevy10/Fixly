import type { RequestStatus } from '@/shared/constants/request-status'

export type MockRequest = {
  id: string
  customerId: string
  customerName: string
  customerPhone?: string
  professionalId: string
  professionalName: string
  category: string
  title?: string
  description: string
  status: RequestStatus
  createdAt: string
  location?: string
  preferredDate?: string
  preferredTime?: string
  images?: string[]
  cancellationReason?: string
}

export type CreateRequestInput = Omit<
  MockRequest,
  'id' | 'createdAt' | 'status'
>

export const MOCK_REQUESTS: MockRequest[] = [
  {
    id: 'req-1',
    customerId: 'guest@fixly.app',
    customerName: 'אורח',
    professionalId: '1',
    professionalName: 'יוסי כהן',
    category: 'אינסטלציה',
    title: 'ברז דולף במטבח',
    description: 'ברז דולף במטבח, צריך תיקון דחוף',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    location: 'תל אביב',
  },
  {
    id: 'req-2',
    customerId: 'guest@fixly.app',
    customerName: 'אורח',
    professionalId: '1',
    professionalName: 'יוסי כהן',
    category: 'מיזוג אוויר',
    title: 'מזגן לא מקרר',
    description: 'מזגן בסלון לא מקרר כמו שצריך',
    status: 'pending',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    location: 'חיפה',
  },
  {
    id: 'req-3',
    customerId: 'guest@fixly.app',
    customerName: 'אורח',
    professionalId: '4',
    professionalName: 'רחל גרין',
    category: 'ניקיון',
    description: 'ניקיון דירה לפני כניסה',
    status: 'completed',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    location: 'תל אביב',
  },
]
