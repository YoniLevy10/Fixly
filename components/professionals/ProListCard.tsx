'use client'

import { useRouter } from 'next/navigation'
import { Clock, MessageCircle } from 'lucide-react'
import type { Professional } from '@/types/professional'
import { routes } from '@/lib/routes'
import VerifiedBadge from '@/components/shared/VerifiedBadge'
import ResponseTimeBadge from '@/components/shared/ResponseTimeBadge'
import AvailableTodayBadge from '@/components/shared/AvailableTodayBadge'
import { formatPrice } from '@/lib/i18n/format-locale'
import { useLocale } from '@/lib/i18n/locale-provider'

type ProListCardProps = {
  professional: Professional
}

export default function ProListCard({ professional: pro }: ProListCardProps) {
  const router = useRouter()
  const { t, locale } = useLocale()

  return (
    <div className="bg-card rounded-2xl border-2 border-border p-4 shadow-md hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-14 h-14 rounded-full flex-shrink-0 bg-primary text-white bg-cover bg-center border-2 border-gray-50 flex items-center justify-center font-bold text-lg"
          style={{
            backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
          }}
        >
          {!pro.avatarUrl && pro.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm">{pro.name}</h3>
                {pro.isVerified && <VerifiedBadge />}
                <AvailableTodayBadge isAvailable={pro.isAvailable} />
                {pro.isApproved && (
                  <span className="text-primary text-xs font-bold">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{pro.title ?? pro.category}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <ResponseTimeBadge avgResponseMinutes={pro.avgResponseMinutes} />
              </div>
              {pro.availableHours && (
                <p className="text-xs text-gray-400">{pro.availableHours}</p>
              )}
            </div>
            <div className="text-end">
              <p className="font-black text-base">
                {formatPrice(locale, pro.startingPrice)}
              </p>
              <p className="text-xs text-gray-400">{t('common.quoteLabel')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`text-xs ${s <= Math.round(pro.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
              >
                ★
              </span>
            ))}
            <span className="text-xs font-semibold text-gray-600">
              {pro.rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">({pro.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div
              className={`flex items-center gap-1 text-xs font-medium ${pro.isAvailable ? 'text-green-500' : 'text-gray-400'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${pro.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}
              />
              {pro.isAvailable ? t('common.availableNow') : t('common.unavailable')}
            </div>
            {pro.availableHours && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} />
                {pro.availableHours}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => router.push(routes.professional(pro.id))}
          className="flex-1 border border-gray-200 text-gray-600 text-xs h-9 rounded-lg font-medium flex items-center justify-center gap-1"
        >
          <MessageCircle size={14} /> {t('common.profile')}
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(`${routes.newRequest}?professional=${pro.id}`)
          }
          className="flex-1 bg-primary text-white text-xs h-9 rounded-lg font-bold"
        >
          {t('common.select')}
        </button>
      </div>
    </div>
  )
}
