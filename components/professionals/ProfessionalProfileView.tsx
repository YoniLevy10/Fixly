'use client'

import Link from 'next/link'
import ReviewsList from '@/components/reviews/ReviewsList'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'
import { getBeautyEtaMinutes } from '@/mock/beauty-professionals'
import type { Professional } from '@/types/professional'
import { MapPin } from 'lucide-react'

type ProfessionalProfileViewProps = {
  pro: Professional
}

export default function ProfessionalProfileView({ pro }: ProfessionalProfileViewProps) {
  const { t } = useLocale()
  const eta = getBeautyEtaMinutes(pro)

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-6">
      <div className="relative h-36 lg:h-48 lg:mx-8 lg:mt-6 lg:rounded-3xl overflow-hidden bg-[hsl(20_14%_12%)]">
        {pro.gallery?.[0] ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{ backgroundImage: `url(${pro.gallery[0]})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="px-4 -mt-12 relative z-10 lg:px-8 lg:grid lg:grid-cols-3 lg:gap-6 max-w-6xl mx-auto">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
            <div className="flex gap-4 items-start">
              <div
                className="w-20 h-20 rounded-2xl border-2 border-card shadow-md bg-cover bg-center shrink-0 -mt-10 lg:-mt-14 ring-2 ring-border"
                style={{
                  backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
                  backgroundColor: 'hsl(20 14% 20%)',
                }}
              />
              <div className="min-w-0 pt-1">
                <h1 className="text-xl font-black">{pro.name}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {pro.title ?? pro.category}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm flex-wrap">
              <span className="font-semibold">★ {pro.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({pro.reviewCount} {t('common.reviews')})
              </span>
              {pro.location && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} />
                  {pro.location}
                </span>
              )}
              <span
                className={`ms-auto text-xs font-bold ${pro.isAvailable ? 'text-[hsl(152_40%_32%)]' : 'text-muted-foreground'}`}
              >
                {pro.isAvailable
                  ? `זמין · ≈ ${eta} דק׳`
                  : t('common.unavailable')}
              </span>
            </div>
            {pro.description && (
              <p className="text-sm text-foreground/70 mt-3 leading-relaxed">
                {pro.description}
              </p>
            )}
          </div>

          {pro.services && pro.services.length > 0 && (
            <div className="bg-card rounded-3xl border border-border p-4">
              <h2 className="font-bold mb-3">{t('professionals.servicesAndPrices')}</h2>
              <ul className="space-y-2">
                {pro.services.map((s) => (
                  <li
                    key={s.name}
                    className="flex justify-between text-sm border-b border-border/60 pb-2 last:border-0"
                  >
                    <span>{s.name}</span>
                    <span className="font-bold">₪{s.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pro.gallery && pro.gallery.length > 0 && (
            <div className="bg-card rounded-3xl border border-border p-4">
              <h2 className="font-bold mb-3">עבודות אחרונות</h2>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {pro.gallery.map((src) => (
                  <div
                    key={src}
                    className="w-36 h-24 rounded-xl bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url(${src})` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-3xl border border-border p-4">
            <h2 className="font-bold mb-3">{t('common.reviews')}</h2>
            <ReviewsList professionalId={pro.id} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="hidden lg:block bg-card rounded-3xl border border-border p-5 shadow-sm sticky top-24">
            <p className="text-sm text-muted-foreground mb-1">{t('common.fromPrice')}</p>
            <p className="text-2xl font-black mb-4">₪{pro.startingPrice}</p>
            <Link
              href={routes.book(pro.id)}
              className="block w-full bg-[hsl(20_14%_12%)] text-white text-center py-3.5 rounded-2xl font-bold hover:bg-[hsl(20_14%_8%)] transition-colors"
            >
              הזמינו עד הבית
            </Link>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur p-4 safe-area-pb">
        <Link
          href={routes.book(pro.id)}
          className="block w-full bg-[hsl(20_14%_12%)] text-white text-center py-3.5 rounded-2xl font-bold"
        >
          הזמינו עד הבית · מ־₪{pro.startingPrice}
        </Link>
      </div>
    </div>
  )
}
