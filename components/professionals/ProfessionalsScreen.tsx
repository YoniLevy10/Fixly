'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { PROFESSIONALS_FILTER_CATEGORIES } from '@/mock/categories'
import ProListCard from '@/components/professionals/ProListCard'
import { getCategoryLabel } from '@/lib/i18n/category-label'
import { useLocale } from '@/lib/i18n/locale-provider'
import { cn } from '@/lib/utils/cn'
import type { Professional } from '@/types/professional'

export default function ProfessionalsScreen() {
  const { locale, t } = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') ?? '',
  )
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'jobs'>(
    (searchParams.get('sortBy') as 'rating' | 'price' | 'jobs') || 'rating',
  )
  const [showSort, setShowSort] = useState(false)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(tmr)
  }, [query])

  // Keep local filters in sync when home tiles navigate with ?category=
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') ?? '')
    const q = searchParams.get('q')
    if (q != null) {
      setQuery(q)
      setDebouncedQuery(q)
    }
    const s = searchParams.get('sortBy') as 'rating' | 'price' | 'jobs' | null
    if (s === 'rating' || s === 'price' || s === 'jobs') setSortBy(s)
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    params.set('sortBy', sortBy)
    const qs = params.toString()
    router.replace(qs ? `/professionals?${qs}` : '/professionals', {
      scroll: false,
    })

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetch(`/api/professionals?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('load-failed')
        return res.json()
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setProfessionals(Array.isArray(data) ? data : [])
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(t('professionals.loadError'))
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          /* keep previous list for soft failure */
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedQuery, selectedCategory, sortBy, router, t])

  const chips = useMemo(() => PROFESSIONALS_FILTER_CATEGORIES, [])

  return (
    <div className="min-h-screen px-3 py-4 pb-28 lg:px-8 lg:py-6">
      <h1 className="fixly-page-title mb-4 animate-ios-fade">
        {t('professionals.title')}
      </h1>

      <div className="relative mb-3">
        <Search
          className="absolute end-3 top-1/2 -translate-y-1/2 text-foreground/40"
          size={18}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('professionals.searchPlaceholder')}
          className="w-full apple-glass rounded-2xl pe-10 ps-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
          aria-busy={loading}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors active:scale-[0.97]',
            !selectedCategory
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
              : 'apple-glass-pill border-transparent text-foreground/60',
          )}
        >
          {t('common.all')}
        </button>
        {chips.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() =>
              setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)
            }
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1 active:scale-[0.97]',
              selectedCategory === cat.slug
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
                : 'apple-glass-pill border-transparent text-foreground/60',
            )}
          >
            <span>{cat.icon}</span>
            {getCategoryLabel(locale, cat.slug, cat.name)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setShowSort((v) => !v)}
          className="flex items-center gap-1 text-sm text-foreground/60 active:scale-[0.97]"
        >
          <SlidersHorizontal size={16} />
          {t('professionals.sort')}
        </button>
        <span className="text-sm text-foreground/50">
          {loading && professionals.length === 0
            ? '…'
            : `${professionals.length} ${t('common.results')}`}
        </span>
      </div>

      {showSort && (
        <div className="ios27-surface p-3 mb-4 flex gap-2 animate-ios-slide-up">
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
              onClick={() => {
                setSortBy(key)
                setShowSort(false)
              }}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold active:scale-[0.97]',
                sortBy === key ? 'bg-primary text-white' : 'bg-muted text-foreground/60',
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="bg-destructive/10 text-destructive rounded-2xl p-3 mb-3 text-sm">
          {error}
        </div>
      )}

      <div className={cn('space-y-3', loading && professionals.length > 0 && 'opacity-70')}>
        {loading && professionals.length === 0 && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 ios27-surface animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading && professionals.length === 0 && (
          <div className="text-center py-8 space-y-1 ios27-surface">
            <p className="text-sm font-medium">{t('professionals.emptyTitle')}</p>
            <p className="text-xs text-muted-foreground">
              {t('professionals.emptyHint')}
            </p>
          </div>
        )}
        {professionals.map((pro) => (
          <ProListCard key={pro.id} professional={pro} />
        ))}
      </div>
    </div>
  )
}
