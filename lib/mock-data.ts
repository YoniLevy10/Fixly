import { Professional, ServiceRequest } from '@/types'

export const categories = [
  {
    id: '1',
    slug: 'electrician',
    name: 'Electrician',
    icon: '⚡',
  },
  {
    id: '2',
    slug: 'cleaning',
    name: 'Cleaning',
    icon: '✨',
  },
  {
    id: '3',
    slug: 'plumbing',
    name: 'Plumbing',
    icon: '🔧',
  },
]

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
  {
    id: '3',
    name: 'Rapid Plumbing',
    category: 'Plumbing',
    rating: 4.7,
    jobsCompleted: 64,
    available: false,
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
  {
    id: '2',
    title: 'Apartment Cleaning',
    description: 'Need deep cleaning before weekend',
    status: 'pending',
    customerName: 'David Levi',
    professionalId: '2',
    address: 'Ramat Gan',
    createdAt: new Date().toISOString(),
  },
]
