import { Professional, ServiceRequest } from '@/types'

export const professionals: Professional[] = [
  {
    id: '1',
    name: 'Daniel Electric',
    category: 'Electrician',
    rating: 4.9,
    jobsCompleted: 120,
    available: true,
  },
  {
    id: '2',
    name: 'Clean House IL',
    category: 'Cleaning',
    rating: 4.8,
    jobsCompleted: 87,
    available: true,
  },
]

export const requests: ServiceRequest[] = [
  {
    id: '1',
    title: 'Electricity Repair',
    description: 'Kitchen lights not working',
    status: 'on_the_way',
    customerName: 'Sarah Cohen',
    professionalId: '1',
    address: 'Tel Aviv',
    createdAt: new Date().toISOString(),
  },
]
