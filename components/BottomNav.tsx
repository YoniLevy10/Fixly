'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { id: 'home', label: 'בית', href: '/', icon: 'home' },
  { id: 'chat', label: "צ'אט", href: '/chat', icon: 'chat' },
  { id: 'post', label: 'פרסם תקלה', href: '/request', icon: 'plus', isCenter: true },
  { id: 'messages', label: 'הודעות', href: '/messages', icon: 'messages' },
  { id: 'profile', label: 'פרופיל', href: '/profile', icon: 'profile' },
]

function NavIcon({ icon, isActive, isCenter }: { icon: string; isActive: boolean; isCenter?: boolean }) {
  const color = isCenter ? 'white' : isActive ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))'
  
  switch (icon) {
    case 'home':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={isActive ? color : 'none'} />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'chat':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <circle cx="9" cy="10" r="1" fill={color} />
          <circle cx="12" cy="10" r="1" fill={color} />
          <circle cx="15" cy="10" r="1" fill={color} />
        </svg>
      )
    case 'plus':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    case 'messages':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    case 'profile':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    default:
      return null
  }
}

export default function BottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-[430px] px-4 pb-safe-bottom">
        <div className="bg-card rounded-t-3xl shadow-nav px-2 pt-2 pb-2 flex items-end justify-between">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            
            if (item.isCenter) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex flex-col items-center -mt-6 tap-highlight-none"
                >
                  <div className="w-14 h-14 rounded-full bg-primary shadow-button flex items-center justify-center">
                    <NavIcon icon={item.icon} isActive={false} isCenter />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground mt-1">
                    {item.label}
                  </span>
                </Link>
              )
            }
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col items-center py-2 px-3 tap-highlight-none min-w-[60px]"
              >
                <NavIcon icon={item.icon} isActive={isActive} />
                <span 
                  className={`text-[10px] font-semibold mt-1 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
