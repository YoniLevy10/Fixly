import Image from 'next/image'
import Link from 'next/link'
import type { Professional } from '@/types/professional'
import { routes } from '@/lib/routes'
import VerifiedBadge from '@/components/shared/VerifiedBadge'
import MidragVerifiedBadge from '@/components/shared/MidragVerifiedBadge'
import AvailableTodayBadge from '@/components/shared/AvailableTodayBadge'
import { formatPrice } from '@/lib/i18n/format-locale'
import type { Locale } from '@/lib/i18n/types'

export type ProListCardLabels = {
  profile: string
  chat: string
}

type ProListCardProps = {
  professional: Professional
  /** Defaults to Hebrew — SEO landing pages are he-IL. */
  labels?: ProListCardLabels
  locale?: Locale
}

const DEFAULT_LABELS: ProListCardLabels = {
  profile: 'פרופיל',
  chat: 'שיחה',
}

/**
 * Prefer Server Component usage (services SEO pages).
 * Client parents (ProfessionalsScreen) may still import this — pass labels from useLocale.
 */
export default function ProListCard({
  professional: pro,
  labels = DEFAULT_LABELS,
  locale = 'he',
}: ProListCardProps) {
  const rating = Math.min(5, Math.max(0, Number(pro.rating) || 0))
  const profileHref = routes.professional(pro.id)

  return (
    <div className="ios27-surface p-4 hover:border-primary/40 transition-colors duration-[var(--dur-1)]">
      <div className="flex items-start gap-3">
        <Link
          href={profileHref}
          className="relative w-12 h-12 rounded-full flex-shrink-0 bg-primary text-white overflow-hidden flex items-center justify-center font-bold"
          aria-label={pro.name}
        >
          {pro.avatarUrl ? (
            <Image
              src={pro.avatarUrl}
              alt=""
              width={48}
              height={48}
              sizes="48px"
              className="object-cover"
            />
          ) : (
            pro.name.charAt(0)
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={profileHref} className="min-w-0">
                  <h3 className="font-bold text-sm truncate hover:text-primary">
                    {pro.name}
                  </h3>
                </Link>
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
              <p className="font-bold text-sm">{formatPrice(locale, pro.startingPrice)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Link
          href={profileHref}
          className="flex-1 border border-gray-200 text-gray-600 text-xs h-9 rounded-lg font-medium inline-flex items-center justify-center"
        >
          {labels.profile}
        </Link>
        <Link
          href={routes.chat(pro.id)}
          className="flex-1 bg-primary text-white text-xs h-9 rounded-lg font-bold inline-flex items-center justify-center"
        >
          {labels.chat}
        </Link>
      </div>
    </div>
  )
}
