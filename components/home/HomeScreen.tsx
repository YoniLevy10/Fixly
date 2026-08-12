'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, ChevronDown, MapPin } from 'lucide-react'
import FeaturedProCard from '@/components/home/FeaturedProCard'
import { routes } from '@/lib/routes'
import { useAuth } from '@/lib/auth/auth-provider'
import { getCategoryLabel } from '@/lib/i18n/category-label'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { featureFlags } from '@/lib/feature-flags'
import { getSeasonalCategorySlugs } from '@/lib/seasonal-categories'
import { getCategoryAccent } from '@/lib/ui/category-colors'
import { useLocale } from '@/lib/i18n/locale-provider'
import type { Professional } from '@/types/professional'
import DemoPlatformStats from '@/components/demo/DemoPlatformStats'

export default function HomeScreen() {
  const { user } = useAuth()
  const { locale, dir, t } = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllCats, setShowAllCats] = useState(false)
  const [featured, setFeatured] = useState<Professional[]>([])
  const [categories, setCategories] = useState<
    { slug: string; name: string; icon: string }[]
  >([])
  const router = useRouter()
  const firstName = user.fullName.split(' ')[0] || t('common.guest')
  const ChevronAll = dir === 'rtl' ? ChevronLeft : ChevronRight

  useEffect(() => {
    fetch('/api/professionals?featured=true')
      .then((res) => res.json())
      .then((data) => setFeatured(Array.isArray(data) ? data : []))
      .catch(() => setFeatured([]))
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) =>
        setCategories(
          Array.isArray(data)
            ? data.map(
                (c: {
                  slug: string
                  nameHe: string
                  name?: string
                  icon: string
                }) => ({
                  slug: c.slug,
                  name: getCategoryLabel(locale, c.slug, c.nameHe || c.name),
                  icon: c.icon,
                })
              )
            : []
        )
      )
  }, [locale])

  const displayCats = showAllCats ? categories : categories.slice(0, 9)
  const seasonalSlugs = featureFlags.seasonalCategories ? getSeasonalCategorySlugs() : []
  const seasonalCats = categories.filter((c) => seasonalSlugs.includes(c.slug))

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
      <div className="lg:hidden bg-white px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm safe-area-pt">
        <LanguageToggle />
        <div className="text-center">
          <p className="font-bold text-sm text-foreground">
            👋 {t('home.greeting')}, {firstName}
          </p>
          <p className="flex items-center gap-1 text-xs text-foreground/70 justify-center mt-0.5">
            <MapPin size={11} className="text-primary" />
            {user.location ?? t('common.defaultLocation')}
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
        <div className="p-5 pe-36 relative z-10">
          <h2 className="text-white font-black text-xl leading-tight mb-1">
            {t('home.heroTitle')}
          </h2>
          <p className="text-white/90 text-sm leading-relaxed mb-3">
            {t('home.heroSubtitle')}
            <br />
            {t('home.heroSubtitle2')}
          </p>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="w-full bg-white rounded-xl px-4 ps-9 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>
        <div className="absolute top-0 end-0 bottom-0 w-32 flex items-end justify-center overflow-hidden">
          <div className="w-28 h-32 bg-white/10 rounded-full blur-2xl absolute" />
          <span className="text-7xl pb-2 relative z-10" role="img" aria-hidden>
            👷
          </span>
        </div>
      </div>

      <DemoPlatformStats />

      <div className="px-4 lg:px-8">
        {featureFlags.quickRequest && (
          <div className="flex gap-2 mb-4">
            <Link
              href={routes.quickRequest}
              className="flex-1 text-center py-2.5 rounded-xl bg-secondary text-white text-sm font-bold"
            >
              {t('improvements.quickRequest')}
            </Link>
          </div>
        )}

        {seasonalCats.length > 0 && (
          <div className="mb-4">
            <p className="fixly-section-title mb-2">{t('improvements.seasonalTitle')}</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {seasonalCats.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`${routes.professionals}?category=${cat.slug}`}
                  className={`flex-shrink-0 px-3 py-2 rounded-full border-2 text-xs font-bold ${getCategoryAccent(cat.slug).chip}`}
                >
                  {cat.icon} {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5 lg:mb-8">
          <h3 className="fixly-section-title mb-3">{t('home.pickCategory')}</h3>
          <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-4 xl:grid-cols-5 lg:gap-3">
            {displayCats.map((cat) => {
              const accent = getCategoryAccent(cat.slug)
              return (
              <Link
                key={cat.slug}
                href={`${routes.professionals}?category=${cat.slug}`}
                className={`bg-card rounded-2xl border-2 p-3 flex flex-col items-center gap-2 shadow-sm transition-all active:scale-95 ${accent.card}`}
              >
                <span className={`text-3xl w-12 h-12 flex items-center justify-center rounded-xl ${accent.iconBg}`}>
                  {cat.icon}
                </span>
                <span className="text-xs font-bold text-foreground text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            )})}
          </div>
          <button
            type="button"
            onClick={() => setShowAllCats(!showAllCats)}
            className="mt-2.5 w-full bg-muted border-2 border-border rounded-2xl py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-foreground hover:bg-primary/10 hover:border-primary transition-colors"
          >
            <ChevronDown
              size={15}
              className={`transition-transform ${showAllCats ? 'rotate-180' : ''}`}
            />
            {showAllCats ? t('home.lessCategories') : t('home.moreCategories')}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={routes.professionals}
              className="text-primary text-sm font-medium flex items-center gap-0.5"
            >
              <ChevronAll size={16} />
              {t('home.showAll')}
            </Link>
            <h3 className="fixly-section-title">{t('home.featuredPros')}</h3>
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
