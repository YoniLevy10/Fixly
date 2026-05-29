'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/i18n/format-date'
import { useLocale } from '@/lib/i18n/locale-provider'
import type { Review } from '@/types/review'

type ReviewsListProps = {
  professionalId: string
}

export default function ReviewsList({ professionalId }: ReviewsListProps) {
  const { locale, t } = useLocale()
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    fetch(`/api/reviews?professionalId=${professionalId}`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
  }, [professionalId])

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">{t('reviews.empty')}</p>
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
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
  )
}
