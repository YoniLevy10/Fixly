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
  /**
   * Absolute product host origin (e.g. PRODUCT_URL) so marketing-host SEO
   * pages can deep-link into the app without hitting the waitlist redirect.
   */
  productBaseUrl?: string
}

const DEFAULT_LABELS: ProListCardLabels = {
  profile: 'פרופיל',
  chat: 'שיחה',
}

function withProductBase(base: string | undefined, path: string): string {
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path}`
}

/**
 * Prefer Server Component usage (services SEO pages).
 * Client parents (ProfessionalsScreen) may still import this — pass labels from useLocale.
 */
export default function ProListCard({
  professional: pro,
  labels = DEFAULT_LABELS,
  locale = 'he',
  productBaseUrl,
}: ProListCardProps) {
  const rating = Math.min(5, Math.max(0, Number(pro.rating) || 0))
  const profileHref = withProductBase(productBaseUrl, routes.professional(pro.id))
  const chatHref = withProductBase(productBaseUrl, routes.chat(pro.id))

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 hover:border-primary/35 transition-colors duration-[var(--dur-1)]">
      <div className="flex items-start gap-3">
        <Link
          href={profileHref}
          className="relative w-12 h-12 rounded-full flex-shrink-0 bg-primary text-primary-foreground overflow-hidden flex items-center justify-center font-bold ring-2 ring-border"
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
                  <h3 className="font-extrabold text-sm truncate hover:text-primary">
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
              <p className="text-xs text-muted-foreground truncate">
                {pro.title ?? pro.category}
              </p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {pro.reviewCount > 0 ? (
                  <>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`text-xs ${s <= Math.round(rating) ? 'text-secondary' : 'text-border'}`}
                        aria-hidden
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs font-semibold text-foreground">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">({pro.reviewCount})</span>
                  </>
                ) : null}
                <AvailableTodayBadge isAvailable={pro.isAvailable} />
              </div>
            </div>
            <div className="text-end shrink-0">
              <p className="font-extrabold text-sm text-foreground">
                {formatPrice(locale, pro.startingPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Link
          href={profileHref}
          className="flex-1 border border-border text-foreground text-xs min-h-10 rounded-xl font-bold inline-flex items-center justify-center hover:bg-primary/5 transition-colors"
        >
          {labels.profile}
        </Link>
        <Link
          href={chatHref}
          className="flex-1 bg-primary text-primary-foreground text-xs min-h-10 rounded-xl font-extrabold inline-flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          {labels.chat}
        </Link>
      </div>
    </div>
  )
}
