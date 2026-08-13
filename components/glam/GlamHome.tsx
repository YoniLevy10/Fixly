'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Sparkles, ArrowLeft } from 'lucide-react'
import { BRAND, BEAUTY_VERTICALS } from '@/lib/beauty/catalog'
import { routes } from '@/lib/routes'
import { getBeautyEtaMinutes } from '@/mock/beauty-professionals'
import type { Professional } from '@/types/professional'
import { cn } from '@/lib/utils/cn'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&h=1200&fit=crop'

export default function GlamHome() {
  const [featured, setFeatured] = useState<Professional[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true))
    fetch('/api/professionals?featured=true')
      .then((res) => res.json())
      .then((data) => setFeatured(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => setFeatured([]))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Full-bleed hero — one composition */}
      <section className="relative min-h-[100svh] lg:min-h-[92vh] flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(20_14%_8%)] via-[hsl(20_14%_8%/0.72)] to-[hsl(20_14%_8%/0.35)]" />
        <div className="absolute inset-0 glam-grain pointer-events-none opacity-40" />

        <header
          className={cn(
            'relative z-10 flex items-center justify-between px-5 pt-5 safe-area-pt lg:px-10 lg:pt-8',
            'transition-all duration-700',
            ready ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}
        >
          <p className="font-glam text-3xl tracking-wide text-white drop-shadow-sm">{BRAND.nameHe}</p>
          <Link
            href={routes.proJoin}
            className="text-sm font-medium text-white/85 hover:text-white transition-colors"
          >
            לנותני שירות
          </Link>
        </header>

        <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-10 lg:px-10 lg:pb-16 max-w-3xl">
          <div
            className={cn(
              'transition-all duration-700 delay-150',
              ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <p className="font-glam text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-3">
              {BRAND.nameHe}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white/95 leading-snug mb-3 max-w-xl">
              {BRAND.heroHeadlineHe}
            </h1>
            <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-8 max-w-lg">
              {BRAND.heroSupportHe}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`${routes.professionals}?category=nails`}
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(350_38%_62%)] text-white px-6 py-3.5 text-sm font-bold shadow-lg shadow-black/20 hover:bg-[hsl(350_38%_56%)] active:scale-[0.98] transition-all"
              >
                הזמינו עכשיו
                <ArrowLeft size={16} />
              </Link>
              <Link
                href={routes.professionals}
                className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 backdrop-blur-sm text-white px-6 py-3.5 text-sm font-semibold hover:bg-white/18 transition-colors"
              >
                צפו בזמינים
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services — one job */}
      <section className="px-5 py-14 lg:px-10 lg:py-20 max-w-6xl mx-auto">
        <div
          className={cn(
            'mb-8 transition-all duration-700',
            ready ? 'opacity-100' : 'opacity-0'
          )}
        >
          <p className="text-sm font-semibold tracking-wide text-[hsl(350_30%_45%)] mb-2">
            שלב ראשון
          </p>
          <h2 className="text-2xl lg:text-3xl font-black text-foreground">בחרו שירות</h2>
          <p className="mt-2 text-muted-foreground max-w-md">
            מתחילים עם מניקוריסטיות וספרים — בהמשך עוד עולמות ביוטי.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {BEAUTY_VERTICALS.map((v, i) => (
            <Link
              key={v.slug}
              href={`${routes.professionals}?category=${v.slug}`}
              className={cn(
                'group relative overflow-hidden rounded-3xl min-h-[160px] flex flex-col justify-end p-6',
                'bg-gradient-to-br from-[hsl(25_18%_16%)] to-[hsl(20_14%_10%)]',
                'hover:scale-[1.01] active:scale-[0.99] transition-transform duration-300',
                'animate-glam-rise'
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="absolute top-5 end-5 text-4xl opacity-80 group-hover:scale-110 transition-transform">
                {v.emoji}
              </span>
              <h3 className="text-xl font-bold text-white mb-1">{v.nameHe}</h3>
              <p className="text-sm text-white/65">{v.taglineHe}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Available now */}
      <section className="px-5 pb-16 lg:px-10 lg:pb-24 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-foreground flex items-center gap-2">
              <Sparkles className="text-[hsl(350_38%_55%)]" size={22} />
              זמינים עכשיו
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              השוו דירוגים, מחירים וזמן הגעה — והזמינו בלחיצה.
            </p>
          </div>
          <Link
            href={routes.professionals}
            className="text-sm font-bold text-[hsl(350_30%_42%)] hover:underline shrink-0"
          >
            להכל
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {featured.map((pro, i) => {
            const eta = getBeautyEtaMinutes(pro)
            return (
              <Link
                key={pro.id}
                href={routes.professional(pro.id)}
                className={cn(
                  'flex gap-4 p-4 rounded-2xl bg-card/80 border border-border/80',
                  'hover:border-[hsl(350_30%_70%)] hover:bg-card transition-colors',
                  'animate-glam-rise'
                )}
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                <div
                  className="w-16 h-16 rounded-2xl bg-cover bg-center shrink-0 ring-1 ring-border"
                  style={{
                    backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
                    backgroundColor: 'hsl(20 14% 20%)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground truncate">{pro.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {pro.title ?? pro.category}
                      </p>
                    </div>
                    <p className="font-black text-foreground shrink-0">
                      ₪{pro.startingPrice}
                      <span className="text-xs font-medium text-muted-foreground">+</span>
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="font-semibold text-foreground">
                      ★ {pro.rating.toFixed(1)}
                      <span className="text-muted-foreground font-normal">
                        {' '}
                        ({pro.reviewCount})
                      </span>
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin size={11} />
                      {pro.location}
                    </span>
                    {pro.isAvailable && (
                      <span className="text-[hsl(152_40%_32%)] font-semibold">
                        הגעה ≈ {eta} דק׳
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* How it works — one job */}
      <section className="border-t border-border bg-[hsl(25_12%_14%)] text-[hsl(30_20%_94%)] px-5 py-14 lg:px-10 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-glam text-3xl lg:text-4xl mb-2">איך זה עובד</h2>
          <p className="text-white/60 mb-10 max-w-md">
            כמו Uber לנהגים — ככה גלאם לנותני שירותי ביוטי.
          </p>
          <ol className="grid gap-8 sm:grid-cols-3">
            {[
              {
                n: '01',
                t: 'בחרו שירות',
                d: 'מניקור, פדיקור, תספורת או עיצוב — מה שאתם צריכים עכשיו.',
              },
              {
                n: '02',
                t: 'השוו והזמינו',
                d: 'ראו מי זמין, השוו מחירים ודירוגים, שלמו באפליקציה.',
              },
              {
                n: '03',
                t: 'מגיעים אליכם',
                d: 'בעל המקצוע מגיע עד הבית, המלון או המשרד — בלי לנסוע.',
              },
            ].map((step) => (
              <li key={step.n}>
                <p className="font-glam text-4xl text-[hsl(350_38%_62%)] mb-3">{step.n}</p>
                <h3 className="text-lg font-bold mb-2">{step.t}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
