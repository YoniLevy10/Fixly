'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronDown, MapPin } from 'lucide-react'
import { HOME_DISPLAY_CATEGORIES } from '@/mock/categories'
import FeaturedProCard from '@/components/home/FeaturedProCard'
import { routes } from '@/lib/routes'
import { useAuth } from '@/lib/auth/auth-provider'
import type { Professional } from '@/types/professional'

export default function HomeScreen() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllCats, setShowAllCats] = useState(false)
  const [featured, setFeatured] = useState<Professional[]>([])
  const router = useRouter()
  const firstName = user.fullName.split(' ')[0] || 'אורח'

  useEffect(() => {
    fetch('/api/professionals?featured=true')
      .then((res) => res.json())
      .then((data) => setFeatured(Array.isArray(data) ? data : []))
      .catch(() => setFeatured([]))
  }, [])
  const displayCats = showAllCats
    ? HOME_DISPLAY_CATEGORIES
    : HOME_DISPLAY_CATEGORIES.slice(0, 9)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    router.push(
      q
        ? `${routes.professionals}?q=${encodeURIComponent(q)}`
        : routes.professionals
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden bg-white px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="w-9" />
        <div className="text-center">
          <p className="font-bold text-sm text-foreground">👋 שלום, {firstName}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500 justify-center mt-0.5">
            <MapPin size={11} className="text-primary" />
            {user.location ?? 'תל אביב-יפו'}
          </p>
        </div>
        <Link
          href={routes.profile}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm"
        >
          {firstName.charAt(0)}
        </Link>
      </div>

      <div
        className="mx-4 mt-3 mb-5 rounded-2xl bg-primary overflow-hidden relative lg:mx-8 lg:mt-6 lg:min-h-[180px]"
        style={{ minHeight: 145 }}
      >
        <div className="p-5 pr-36 relative z-10">
          <h2 className="text-white font-black text-xl leading-tight mb-1">
            זקוקים לתיקון?
          </h2>
          <p className="text-white/80 text-xs leading-relaxed mb-3">
            מצא את איש המקצוע המתאים
            <br />
            במהירות ובקלות
          </p>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="מה צריך לתקן?"
                className="w-full bg-white rounded-xl px-4 pl-9 py-2.5 text-sm text-right text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>
        <div className="absolute top-0 left-0 bottom-0 w-32 flex items-end justify-center overflow-hidden">
          <div className="w-28 h-32 bg-white/10 rounded-full blur-2xl absolute" />
          <span className="text-7xl pb-2 relative z-10" role="img" aria-hidden>
            👷
          </span>
        </div>
      </div>

      <div className="px-4 lg:px-8">
        <div className="mb-5 lg:mb-8">
          <h3 className="text-base font-black text-foreground mb-3 lg:text-lg">בחרו קטגוריה</h3>
          <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-4 xl:grid-cols-5 lg:gap-3">
            {displayCats.map((cat) => (
              <Link
                key={cat.slug}
                href={`${routes.professionals}?category=${cat.slug}`}
                className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center gap-2 hover:border-primary/30 hover:shadow-sm transition-all active:scale-95"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAllCats(!showAllCats)}
            className="mt-2.5 w-full bg-gray-100 rounded-2xl py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <ChevronDown
              size={15}
              className={`transition-transform ${showAllCats ? 'rotate-180' : ''}`}
            />
            {showAllCats ? 'פחות קטגוריות' : 'עוד קטגוריות'}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={routes.professionals}
              className="text-primary text-sm font-medium flex items-center gap-0.5"
            >
              <ChevronLeft size={16} />
              הצג הכל
            </Link>
            <h3 className="text-base font-black text-foreground">אנשי מקצוע מומלצים</h3>
          </div>

          {featured.length === 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-40 h-52 bg-white rounded-2xl border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {featured.map((pro) => (
                <FeaturedProCard key={pro.id} professional={pro} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
