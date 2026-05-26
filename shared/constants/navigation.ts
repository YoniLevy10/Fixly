import { ROUTES } from './routes'

export const CUSTOMER_NAVIGATION = [
  {
    label: 'Home',
    href: ROUTES.HOME,
    icon: '🏠',
  },
  {
    label: 'Professionals',
    href: ROUTES.PROFESSIONALS,
    icon: '👨‍🔧',
  },
  {
    label: 'Requests',
    href: ROUTES.REQUEST_NEW,
    icon: '📦',
  },
] as const

export const PROFESSIONAL_NAVIGATION = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: '📊',
  },
  {
    label: 'Requests',
    href: ROUTES.DASHBOARD_REQUESTS,
    icon: '🛠️',
  },
] as const
