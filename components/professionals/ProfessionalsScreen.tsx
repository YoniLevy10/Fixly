'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { PROFESSIONALS_FILTER_CATEGORIES } from '@/mock/categories'
import ProListCard from '@/components/professionals/ProListCard'
import { cn } from '@/lib/utils/cn'
import type { Professional } from '@/types/professional'

export default function ProfessionalsScreen() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') ?? ''
  )
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'jobs'>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (selectedCategory) params.set('category', selectedCategory)
    params.set('sortBy', sortBy)

    setLoading(true)
    fetch(`/api/professionals?${params}`)
      .then((res) => res.json())
      .then((data) => setProfessionals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [query, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 lg:px-8 lg:py-6">
      <h1 className="text-xl font-black mb-4 lg:text-2xl">חיפוש אנשי מקצוע</h1>

      <div className="relative mb-3">
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפש לפי שם, מקצוע או עיר..."
          className="w-full bg-white border border-gray-200 rounded-2xl pr-10 pl-4 py-3 text-sm outline-none focus:border-primary/40"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            !selectedCategory
              ? 'bg-primary text-white border-primary'
              : 'bg-white border-gray-200 text-gray-600'
          )}
        >
          הכל
        </button>
        {PROFESSIONALS_FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() =>
              setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)
            }
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1',
              selectedCategory === cat.slug
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-gray-200 text-gray-600'
            )}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-sm text-gray-600"
        >
          <SlidersHorizontal size={16} />
          מיון
        </button>
        <span className="text-sm text-gray-500">{professionals.length} תוצאות</span>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4 flex gap-2">
          {(
            [
              ['rating', 'דירוג'],
              ['price', 'מחיר'],
              ['jobs', 'ניסיון'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium',
                sortBy === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 pb-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="font-semibold">לא נמצאו אנשי מקצוע</p>
            <p className="text-sm mt-1">נסה לשנות את החיפוש או הקטגוריה</p>
          </div>
        ) : (
          professionals.map((pro) => <ProListCard key={pro.id} professional={pro} />)
        )}
      </div>
    </div>
  )
}
