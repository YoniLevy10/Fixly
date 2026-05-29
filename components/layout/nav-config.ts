import {
  Home,
  Search,
  ClipboardList,
  User,
  Briefcase,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { routes } from '@/lib/routes'

export type NavItem = {
  path: string
  icon: LucideIcon
  label: string
  exact?: boolean
}

export const primaryNav: NavItem[] = [
  { path: routes.home, icon: Home, label: 'בית', exact: true },
  { path: routes.professionals, icon: Search, label: 'חיפוש' },
  { path: routes.myRequests, icon: ClipboardList, label: 'הבקשות שלי' },
  { path: routes.newRequest, icon: Plus, label: 'בקשה חדשה' },
]

export const secondaryNav: NavItem[] = [
  { path: routes.proDashboard, icon: Briefcase, label: 'דשבורד מקצועי' },
  { path: routes.profile, icon: User, label: 'פרופיל' },
]

export const mobileNav: NavItem[] = [
  { path: routes.profile, icon: User, label: 'פרופיל' },
  { path: routes.myRequests, icon: ClipboardList, label: 'בקשות' },
  { path: routes.professionals, icon: Search, label: 'חיפוש' },
  { path: routes.home, icon: Home, label: 'בית', exact: true },
]
