'use client'

import Image from 'next/image'
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
  const hasReviews = (pro.reviewCount ?? 0) > 0

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-primary-foreground px-4 pt-6 pb-16 relative lg:rounded-[var(--radius-lg)] lg:mx-8 lg:mt-6">
        <div className="flex justify-center">
          <div className="relative w-24 h-24 rounded-2xl border-4 border-card shadow-lg bg-primary-foreground/15 overflow-hidden flex items-center justify-center text-3xl font-extrabold">
            {pro.avatarUrl ? (
              <Image
                src={pro.avatarUrl}
                alt=""
                width={96}
                height={96}
                sizes="96px"
                className="object-cover"
                priority
              />
            ) : (
              pro.name.charAt(0)
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-10 lg:px-8 lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-foreground">{pro.name}</h1>
              {pro.isVerified && <VerifiedBadge />}
              {pro.midragVerified && (
                <MidragVerifiedBadge
                  rating={pro.midragRating}
                  reviewsCount={pro.midragReviewsCount}
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">{pro.title ?? pro.category}</p>
            {pro.midragVerified && pro.midragProfileUrl ? (
              <a
                href={pro.midragProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-info mt-1 inline-flex underline-offset-2 hover:underline"
              >
                {t('trust.midragScore', {
                  rating: String(pro.midragRating ?? '—'),
                  count: String(pro.midragReviewsCount ?? 0),
                })}
              </a>
            ) : pro.midragVerified && (pro.midragRating || pro.midragReviewsCount) ? (
              <p className="text-xs text-info mt-1">
                {t('trust.midragScore', {
                  rating: String(pro.midragRating ?? '—'),
                  count: String(pro.midragReviewsCount ?? 0),
                })}
              </p>
            ) : null}
            <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
              {hasReviews ? (
                <>
                  <span className="text-secondary font-semibold">★ {pro.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({pro.reviewCount} {t('common.reviews')})
                  </span>
                </>
              ) : null}
              {pro.location && (
                <>
                  {hasReviews ? <span className="text-border">•</span> : null}
                  <span className="text-muted-foreground">{pro.location}</span>
                </>
              )}
              <span
                className={`ms-auto text-xs font-medium ${pro.isAvailable ? 'text-success' : 'text-muted-foreground'}`}
              >
                {pro.isAvailable ? t('common.available') : t('common.unavailable')}
              </span>
            </div>
            {pro.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{pro.description}</p>
            )}
          </div>

          {pro.services && pro.services.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
              <h2 className="font-extrabold mb-3 text-foreground">{t('professionals.servicesAndPrices')}</h2>
              <ul className="space-y-2">
                {pro.services.map((s) => (
                  <li
                    key={s.name}
                    className="flex justify-between text-sm border-b border-border pb-2 last:border-0"
                  >
                    <span className="text-foreground">{s.name}</span>
                    <span className="font-extrabold text-primary">
                      {s.price}
                      {t('common.currency')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
            <h2 className="font-extrabold mb-3 text-foreground">{t('common.reviews')}</h2>
            <ReviewsList professionalId={pro.id} />
          </div>
        </div>

        <div className="lg:col-span-1 mt-4 lg:mt-0">
          <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm sticky top-24">
            <p className="text-sm text-muted-foreground mb-1">{t('common.fromPrice')}</p>
            <p className="text-2xl font-extrabold text-primary mb-4">
              {pro.startingPrice}
              {t('common.currency')}
            </p>
            <Link
              href={`${routes.newRequest}?professional=${pro.id}`}
              className="block w-full bg-secondary text-secondary-foreground text-center py-3.5 rounded-xl font-extrabold mb-2 active:scale-[0.98] transition-transform"
            >
              {t('professionals.sendRequest')}
            </Link>
            <Link
              href={routes.chat(pro.id)}
              className="block w-full bg-primary text-primary-foreground text-center py-3.5 rounded-xl font-extrabold active:scale-[0.98] transition-transform"
            >
              {t('common.chat')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
