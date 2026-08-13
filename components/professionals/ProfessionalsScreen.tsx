'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { PROFESSIONALS_FILTER_CATEGORIES } from '@/mock/categories'
import ProListCard from '@/components/professionals/ProListCard'
import { getCategoryLabel } from '@/lib/i18n/category-label'
import { useLocale } from '@/lib/i18n/locale-provider'
import { cn } from '@/lib/utils/cn'
import type { Professional } from '@/types/professional'

export default function ProfessionalsScreen() {
  const { locale, t } = useLocale()
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
    const cat = searchParams.get('category')
    if (cat) setSelectedCategory(cat)
    const q = searchParams.get('q')
    if (q) setQuery(q)
  }, [searchParams])

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
    <div className="min-h-screen bg-background px-4 py-4 lg:px-8 lg:py-6">
      <h1 className="font-glam text-3xl mb-1">{t('professionals.title')}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        השוו מחירים ודירוגים — והזמינו עד הבית
      </p>

      <div className="relative mb-3">
        <Search
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('professionals.searchPlaceholder')}
          className="w-full bg-card border border-border rounded-2xl pe-10 ps-4 py-3 text-sm outline-none focus:border-[hsl(350_38%_55%)]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={cn(
            'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors',
            !selectedCategory
              ? 'bg-[hsl(20_14%_12%)] text-white border-transparent'
              : 'bg-card border-border text-foreground/70'
          )}
        >
          {t('common.all')}
        </button>
        {PROFESSIONALS_FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() =>
              setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)
            }
            className={cn(
              'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1',
              selectedCategory === cat.slug
                ? 'bg-[hsl(20_14%_12%)] text-white border-transparent'
                : 'bg-card border-border text-foreground/70'
            )}
          >
            <span>{cat.icon}</span>
            {getCategoryLabel(locale, cat.slug, cat.name)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <SlidersHorizontal size={16} />
          {t('professionals.sort')}
        </button>
        <span className="text-sm text-muted-foreground">
          {professionals.length} {t('common.results')}
        </span>
      </div>

      {showFilters && (
        <div className="bg-card rounded-2xl border border-border p-3 mb-4 flex gap-2">
          {(
            [
              ['rating', 'professionals.sortRating'],
              ['price', 'professionals.sortPrice'],
              ['jobs', 'professionals.sortJobs'],
            ] as const
          ).map(([key, labelKey]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-semibold',
                sortBy === key
                  ? 'bg-[hsl(20_14%_12%)] text-white'
                  : 'bg-muted text-foreground/70'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-[hsl(350_38%_55%)] rounded-full animate-spin" />
        </div>
      ) : professionals.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-bold mb-1">{t('professionals.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('professionals.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {professionals.map((pro) => (
            <ProListCard key={pro.id} professional={pro} />
          ))}
        </div>
      )}
    </div>
  )
}
