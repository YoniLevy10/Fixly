'use client'

import { useRouter } from 'next/navigation'
import type { Professional } from '@/types/professional'
import { routes } from '@/lib/routes'
import VerifiedBadge from '@/components/shared/VerifiedBadge'
import MidragVerifiedBadge from '@/components/shared/MidragVerifiedBadge'
import AvailableTodayBadge from '@/components/shared/AvailableTodayBadge'
import { formatPrice } from '@/lib/i18n/format-locale'
import { useLocale } from '@/lib/i18n/locale-provider'

type ProListCardProps = {
  professional: Professional
}

export default function ProListCard({ professional: pro }: ProListCardProps) {
  const router = useRouter()
  const { t, locale } = useLocale()
  const rating = Math.min(5, Math.max(0, Number(pro.rating) || 0))

  return (
    <div className="bg-card rounded-2xl border border-border p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 bg-primary text-white bg-cover bg-center flex items-center justify-center font-bold"
          style={{
            backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
          }}
        >
          {!pro.avatarUrl && pro.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm truncate">{pro.name}</h3>
                {pro.isVerified && <VerifiedBadge />}
                {pro.midragVerified && (
                  <MidragVerifiedBadge
                    rating={pro.midragRating}
                    reviewsCount={pro.midragReviewsCount}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {pro.title ?? pro.category}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`text-xs ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                  >
                    ★
                  </span>
                ))}
                <span className="text-xs font-semibold text-gray-600">
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">({pro.reviewCount})</span>
                <AvailableTodayBadge isAvailable={pro.isAvailable} />
              </div>
            </div>
            <div className="text-end shrink-0">
              <p className="font-bold text-sm">
                {formatPrice(locale, pro.startingPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => router.push(routes.professional(pro.id))}
          className="flex-1 border border-gray-200 text-gray-600 text-xs h-9 rounded-lg font-medium"
        >
          {t('common.profile')}
        </button>
        <button
          type="button"
          onClick={() => router.push(routes.chat(pro.id))}
          className="flex-1 bg-primary text-white text-xs h-9 rounded-lg font-bold"
        >
          {t('common.chat') || 'שיחה'}
        </button>
      </div>
    </div>
  )
}
