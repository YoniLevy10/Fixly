/** Smaller request set when demo flag is off but mock backend is on */
import type { MockRequest } from '@/mock/requests'
import { coordsFromLocationText } from '@/lib/tracking/geo'

const h = (hoursAgo: number) =>
  new Date(Date.now() - hoursAgo * 3600000).toISOString()

function base(
  partial: Omit<MockRequest, 'id' | 'createdAt' | 'description'> & {
    id: string
    hoursAgo: number
    description?: string
  }
): MockRequest {
  const { hoursAgo, ...rest } = partial
  const coords = coordsFromLocationText(rest.location)
  return {
    createdAt: h(hoursAgo),
    liveTrackingActive: false,
    destinationLat: coords.lat,
    destinationLng: coords.lng,
    description: rest.description ?? rest.title ?? 'בקשת שירות',
    ...rest,
  }
}

export const LEGACY_DEMO_REQUESTS: MockRequest[] = [
  base({
    id: 'req-demo-1',
    hoursAgo: 2,
    customerId: 'cust-1',
    customerName: 'מיכל כהן',
    professionalId: '1',
    professionalName: 'יוסי כהן',
    category: 'אינסטלציה',
    title: 'ברז דולף במטבח',
    status: 'on_the_way',
    location: 'תל אביב, רחוב דיזנגוף 100',
    liveTrackingActive: true,
    proLat: 32.09,
    proLng: 34.77,
    proLocationUpdatedAt: new Date().toISOString(),
  }),
  base({
    id: 'req-demo-2',
    hoursAgo: 5,
    customerId: 'cust-2',
    customerName: 'אבי רוזן',
    professionalId: '3',
    professionalName: 'מוחמד עבאס',
    category: 'מיזוג אוויר',
    title: 'מזגן לא מקרר',
    status: 'in_progress',
    location: 'חיפה, נווה שאנן',
    liveTrackingActive: true,
    proLat: 32.82,
    proLng: 34.98,
  }),
  base({
    id: 'req-demo-3',
    hoursAgo: 1,
    customerId: 'cust-3',
    customerName: 'שרה לוי',
    professionalId: '2',
    professionalName: 'דוד לוי',
    category: 'חשמל',
    title: 'שקע לא עובד',
    status: 'pending',
    location: 'ירושלים, ארנונה',
  }),
]
