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
  labelKey: string
  exact?: boolean
}

export const primaryNav: NavItem[] = [
  { path: routes.home, icon: Home, labelKey: 'nav.home', exact: true },
  { path: routes.professionals, icon: Search, labelKey: 'nav.search' },
  { path: routes.myRequests, icon: ClipboardList, labelKey: 'nav.myRequests' },
  { path: routes.newRequest, icon: Plus, labelKey: 'nav.newRequest' },
]

export const secondaryNav: NavItem[] = [
  { path: routes.proDashboard, icon: Briefcase, labelKey: 'nav.proDashboard' },
  { path: routes.profile, icon: User, labelKey: 'nav.profile' },
]

export const mobileNav: NavItem[] = [
  { path: routes.profile, icon: User, labelKey: 'nav.profile' },
  { path: routes.myRequests, icon: ClipboardList, labelKey: 'nav.requestsShort' },
  { path: routes.professionals, icon: Search, labelKey: 'nav.search' },
  { path: routes.home, icon: Home, labelKey: 'nav.home', exact: true },
]
