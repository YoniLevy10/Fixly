import Link from 'next/link'
import { routes } from '@/lib/routes'

const navItems = [
  {
    label: 'Home',
    icon: '🏠',
    href: routes.home,
  },
  {
    label: 'Orders',
    icon: '📂',
    href: routes.request('1'),
  },
  {
    label: 'Pro',
    icon: '🛠️',
    href: routes.proDashboard,
  },
  {
    label: 'Admin',
    icon: '👤',
    href: routes.admin,
  },
]

export default function BottomNav() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        background: 'white',
        borderRadius: '28px',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      }}
    >
      {navItems.map((item, index) => (
        <Link
          key={item.label}
          href={item.href}
          style={{
            textDecoration: 'none',
            color: index === 0 ? '#005BFF' : '#9CA3AF',
            fontWeight: index === 0 ? 700 : 500,
          }}
        >
          {item.icon} {item.label}
        </Link>
      ))}
    </div>
  )
}
