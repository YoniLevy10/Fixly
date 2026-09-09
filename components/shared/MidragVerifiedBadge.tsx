'use client'

import { BadgeCheck } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'

/** Midrag (מידרג) verification chip — shown on demo + linked pro profiles. */
export default function MidragVerifiedBadge({
  className = '',
  rating,
  reviewsCount,
}: {
  className?: string
  /** Midrag 0–10 score — when set, shown next to the label */
  rating?: number | null
  reviewsCount?: number | null
}) {
  const { t } = useLocale()
  const score =
    rating != null && Number.isFinite(rating)
      ? t('trust.midragScoreShort', { rating: rating.toFixed(1) })
      : null

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full ring-1 ring-sky-300 ${className}`}
      title={
        reviewsCount != null && reviewsCount > 0
          ? t('trust.midragScore', {
              rating: String(rating ?? '—'),
              count: String(reviewsCount),
            })
          : t('trust.midragVerifiedHint')
      }
    >
      <BadgeCheck size={12} aria-hidden />
      {t('trust.midragVerified')}
      {score ? <span className="font-black tabular-nums">{score}</span> : null}
    </span>
  )
}
