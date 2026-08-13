'use client'

import { useRouter } from 'next/navigation'
import { Clock, MapPin } from 'lucide-react'
import type { Professional } from '@/types/professional'
import { routes } from '@/lib/routes'
import VerifiedBadge from '@/components/shared/VerifiedBadge'
import { getBeautyEtaMinutes } from '@/mock/beauty-professionals'
import { useLocale } from '@/lib/i18n/locale-provider'

type ProListCardProps = {
  professional: Professional
}

export default function ProListCard({ professional: pro }: ProListCardProps) {
  const router = useRouter()
  const { t } = useLocale()
  const eta = getBeautyEtaMinutes(pro)

  return (
    <div className="bg-card rounded-3xl border border-border p-4 shadow-sm hover:border-[hsl(350_30%_70%)] transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex-shrink-0 bg-[hsl(20_14%_20%)] text-white bg-cover bg-center flex items-center justify-center font-bold text-lg"
          style={{
            backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
          }}
        >
          {!pro.avatarUrl && pro.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm">{pro.name}</h3>
                {pro.isVerified && <VerifiedBadge />}
              </div>
              <p className="text-xs text-muted-foreground">{pro.title ?? pro.category}</p>
              {pro.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin size={11} />
                  {pro.location}
                </p>
              )}
            </div>
            <div className="text-end shrink-0">
              <p className="font-black text-base">₪{pro.startingPrice}</p>
              <p className="text-xs text-muted-foreground">החל מ־</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`text-xs ${s <= Math.round(pro.rating) ? 'text-[hsl(38_90%_48%)]' : 'text-border'}`}
              >
                ★
              </span>
            ))}
            <span className="text-xs font-semibold">{pro.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({pro.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${pro.isAvailable ? 'text-[hsl(152_40%_32%)]' : 'text-muted-foreground'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${pro.isAvailable ? 'bg-[hsl(152_40%_42%)] animate-pulse' : 'bg-muted-foreground'}`}
              />
              {pro.isAvailable ? `זמין · ≈ ${eta} דק׳` : t('common.unavailable')}
            </div>
            {pro.availableHours && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
          className="flex-1 border border-border text-foreground/80 text-xs h-10 rounded-xl font-medium"
        >
          {t('common.profile')}
        </button>
        <button
          type="button"
          onClick={() => router.push(routes.book(pro.id))}
          disabled={!pro.isAvailable}
          className="flex-1 bg-[hsl(20_14%_12%)] text-white text-xs h-10 rounded-xl font-bold disabled:opacity-40"
        >
          הזמינו
        </button>
      </div>
    </div>
  )
}
