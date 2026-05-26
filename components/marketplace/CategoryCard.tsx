import Link from 'next/link'
import type { ReactNode } from 'react'

type CategoryCardProps = {
  name: string
  icon: string
  slug: string
}

export default function CategoryCard({ name, icon, slug }: CategoryCardProps) {
  return (
    <Link
      href={`/professionals?category=${slug}`}
      className="flex flex-col items-center bg-card rounded-2xl p-4 shadow-card tap-highlight-none active:scale-[0.98] transition-transform"
    >
      <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mb-3">
        <CategoryIcon icon={icon} />
      </div>
      <span className="text-xs font-semibold text-card-foreground text-center leading-tight">
        {name}
      </span>
    </Link>
  )
}

function CategoryIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, ReactNode> = {
    '/icons/electrician.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" fill="#FFF3C4" />
        <path d="M32 16L24 32h8l-4 16 16-20h-10l6-12z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    '/icons/plumber.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <path d="M32 8v16M24 24h16v8a8 8 0 01-16 0v-8z" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2" />
        <path d="M28 40v8M36 40v8" stroke="#3B82F6" strokeWidth="2" />
        <circle cx="32" cy="52" r="4" fill="#60A5FA" />
      </svg>
    ),
    '/icons/ac.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="16" width="48" height="28" rx="4" fill="#E0F2FE" stroke="#0EA5E9" strokeWidth="2" />
        <path d="M16 50v4M32 50v4M48 50v4" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 32h32M16 38h32" stroke="#0EA5E9" strokeWidth="1.5" />
        <circle cx="48" cy="24" r="3" fill="#38BDF8" />
      </svg>
    ),
    '/icons/locksmith.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="20" y="28" width="24" height="20" rx="2" fill="#D4D4D8" stroke="#71717A" strokeWidth="2" />
        <circle cx="32" cy="20" r="10" fill="none" stroke="#71717A" strokeWidth="4" />
        <circle cx="32" cy="38" r="4" fill="#71717A" />
      </svg>
    ),
    '/icons/painter.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="28" width="40" height="8" rx="2" fill="#94A3B8" />
        <rect x="28" y="36" width="8" height="20" fill="#78716C" />
        <circle cx="20" cy="20" r="6" fill="#EF4444" />
        <circle cx="32" cy="16" r="6" fill="#3B82F6" />
        <circle cx="44" cy="20" r="6" fill="#22C55E" />
      </svg>
    ),
    '/icons/appliance.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="12" width="40" height="44" rx="4" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2" />
        <circle cx="32" cy="32" r="12" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />
        <circle cx="32" cy="32" r="4" fill="#9CA3AF" />
        <rect x="20" y="48" width="8" height="4" rx="1" fill="#D1D5DB" />
        <rect x="36" y="48" width="8" height="4" rx="1" fill="#D1D5DB" />
      </svg>
    ),
    '/icons/tv.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="16" width="48" height="32" rx="2" fill="#1F2937" stroke="#374151" strokeWidth="2" />
        <rect x="12" y="20" width="40" height="24" fill="#3B82F6" />
        <rect x="24" y="52" width="16" height="4" fill="#6B7280" />
        <rect x="20" y="56" width="24" height="2" fill="#9CA3AF" />
      </svg>
    ),
    '/icons/carpentry.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="24" width="40" height="28" rx="2" fill="#D4A574" stroke="#A67C52" strokeWidth="2" />
        <rect x="20" y="32" width="10" height="12" fill="#8B5A2B" />
        <circle cx="44" cy="38" r="4" fill="#A67C52" />
        <rect x="12" y="20" width="40" height="4" fill="#A67C52" />
      </svg>
    ),
    '/icons/cleaning.png': (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <ellipse cx="24" cy="48" rx="12" ry="8" fill="#93C5FD" />
        <rect x="20" y="16" width="8" height="32" fill="#D4A574" />
        <path d="M16 16h16l-4 8H20l-4-8z" fill="#F59E0B" />
        <path d="M44 32l8 16H36l8-16z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
      </svg>
    ),
  }
  
  return iconMap[icon] || (
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <span className="text-2xl">?</span>
    </div>
  )
}
