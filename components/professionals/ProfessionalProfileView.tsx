'use client'

import Link from 'next/link'
import ReviewsList from '@/components/reviews/ReviewsList'
import VerifiedBadge from '@/components/shared/VerifiedBadge'
import MidragVerifiedBadge from '@/components/shared/MidragVerifiedBadge'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'
import type { Professional } from '@/types/professional'

type ProfessionalProfileViewProps = {
  pro: Professional
}

export default function ProfessionalProfileView({ pro }: ProfessionalProfileViewProps) {
  const { t } = useLocale()

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-primary text-white px-4 pt-6 pb-16 relative lg:rounded-2xl lg:mx-8 lg:mt-6">
        <div className="flex justify-center">
          <div
            className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-cover bg-center bg-white/20 flex items-center justify-center text-3xl font-bold"
            style={{
              backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
            }}
          >
            {!pro.avatarUrl && pro.name.charAt(0)}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-10 lg:px-8 lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black">{pro.name}</h1>
              {pro.isVerified && <VerifiedBadge />}
              {pro.midragVerified && <MidragVerifiedBadge />}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{pro.title ?? pro.category}</p>
            {pro.midragVerified && (pro.midragRating || pro.midragReviewsCount) ? (
              <p className="text-xs text-sky-800 mt-1">
                {t('trust.midragScore', {
                  rating: String(pro.midragRating ?? '—'),
                  count: String(pro.midragReviewsCount ?? 0),
                })}
              </p>
            ) : null}
            <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
              <span className="text-yellow-500 font-semibold">★ {pro.rating.toFixed(1)}</span>
              <span className="text-gray-400">
                ({pro.reviewCount} {t('common.reviews')})
              </span>
              {pro.location && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{pro.location}</span>
                </>
              )}
              <span
                className={`ms-auto text-xs font-medium ${pro.isAvailable ? 'text-green-600' : 'text-gray-400'}`}
              >
                {pro.isAvailable ? t('common.available') : t('common.unavailable')}
              </span>
            </div>
            {pro.description && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{pro.description}</p>
            )}
          </div>

          {pro.services && pro.services.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="font-bold mb-3">{t('professionals.servicesAndPrices')}</h2>
              <ul className="space-y-2">
                {pro.services.map((s) => (
                  <li
                    key={s.name}
                    className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0"
                  >
                    <span>{s.name}</span>
                    <span className="font-bold text-primary">
                      {s.price}
                      {t('common.currency')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-bold mb-3">{t('common.reviews')}</h2>
            <ReviewsList professionalId={pro.id} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-24">
            <p className="text-sm text-gray-500 mb-1">{t('common.fromPrice')}</p>
            <p className="text-2xl font-black text-primary mb-4">
              {pro.startingPrice}
              {t('common.currency')}
            </p>
            <Link
              href={`${routes.newRequest}?professional=${pro.id}`}
              className="block w-full bg-primary text-white text-center py-3.5 rounded-2xl font-bold"
            >
              {t('professionals.sendRequest')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
