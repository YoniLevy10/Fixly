'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Professional } from '@/types/professional'
import { routes } from '@/lib/routes'
import AvailableTodayBadge from '@/components/shared/AvailableTodayBadge'
import { useLocale } from '@/lib/i18n/locale-provider'

type FeaturedProCardProps = {
  professional: Professional
}

export default function FeaturedProCard({ professional: pro }: FeaturedProCardProps) {
  const { t } = useLocale()
  const rating = Math.min(5, Math.max(0, Number(pro.rating) || 0))

  return (
    <div className="flex-shrink-0 w-40 min-h-[14.5rem]">
      <Link href={routes.professional(pro.id)} className="block h-full">
        <div className="h-full rounded-[var(--radius-lg)] border border-border bg-card p-3 text-center hover:border-primary/35 hover:shadow-sm transition-all active:scale-95 min-h-[14.5rem] duration-[var(--dur-1)]">
          <div className="relative w-16 h-16 rounded-full mx-auto mb-2 bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl border-2 border-border shadow-sm overflow-hidden">
            {pro.avatarUrl ? (
              <Image
                src={pro.avatarUrl}
                alt=""
                width={64}
                height={64}
                sizes="64px"
                className="object-cover"
                loading="lazy"
              />
            ) : (
              pro.name.charAt(0)
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="font-extrabold text-sm leading-tight text-foreground">{pro.name}</p>
            <AvailableTodayBadge isAvailable={pro.isAvailable} />
            {pro.midragVerified ? (
              <span className="text-[10px] font-bold text-info bg-info/10 px-1.5 py-0.5 rounded-md ring-1 ring-info/20">
                {t('trust.midragVerified')}
                {pro.midragRating != null ? ` · ${pro.midragRating.toFixed(1)}` : ''}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{pro.title ?? pro.category}</p>
          {pro.reviewCount > 0 ? (
            <>
              <div className="flex items-center justify-center gap-0.5 mt-1.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`text-xs ${s <= Math.round(rating) ? 'text-secondary' : 'text-border'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {rating.toFixed(1)} ({pro.reviewCount})
              </p>
            </>
          ) : null}
          <div
            className={`mt-2 text-xs font-semibold flex items-center justify-center gap-1 ${pro.isAvailable ? 'text-success' : 'text-muted-foreground'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${pro.isAvailable ? 'bg-success' : 'bg-muted-foreground'}`}
            />
            {pro.isAvailable ? t('common.availableNow') : t('common.unavailable')}
          </div>
        </div>
      </Link>
    </div>
  )
}
