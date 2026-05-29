'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDate } from '@/lib/i18n/format-date'
import { useLocale } from '@/lib/i18n/locale-provider'
import type { Review } from '@/types/review'

type ReviewsListProps = {
  professionalId: string
}

export default function ReviewsList({ professionalId }: ReviewsListProps) {
  const { locale, t } = useLocale()
  const [reviews, setReviews] = useState<Review[]>([])
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    fetch(`/api/reviews?professionalId=${professionalId}`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
  }, [professionalId])

  const filtered = useMemo(
    () => (minRating > 0 ? reviews.filter((r) => r.rating >= minRating) : reviews),
    [reviews, minRating]
  )

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">{t('reviews.empty')}</p>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">{t('improvements.reviewsFilter')}</span>
        {[0, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setMinRating(n)}
            className={`text-xs px-2 py-1 rounded-full ${
              minRating === n ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            {n === 0 ? t('common.all') : `${n}+★`}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {filtered.map((r) => (
          <li key={r.id} className="bg-white rounded-xl border p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}</span>
              <span className="text-xs text-gray-400">
                {formatDate(locale, r.createdAt)}
              </span>
            </div>
            {r.text && <p className="text-sm text-gray-700">{r.text}</p>}
            {r.customerName && (
              <p className="text-xs text-gray-400 mt-1">— {r.customerName}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
