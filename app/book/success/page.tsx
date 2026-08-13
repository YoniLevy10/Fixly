'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, MapPin, Clock, Sparkles } from 'lucide-react'
import { routes } from '@/lib/routes'
import type { BeautyBooking } from '@/lib/beauty/booking-store'
import { BRAND } from '@/lib/beauty/catalog'

function SuccessContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [booking, setBooking] = useState<BeautyBooking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    fetch(`/api/bookings?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBooking(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-muted border-t-[hsl(350_38%_55%)] rounded-full animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-20 px-4">
        <p className="font-bold mb-2">לא נמצאה הזמנה</p>
        <Link href={routes.home} className="text-[hsl(350_30%_42%)] font-semibold">
          חזרה ל{BRAND.nameHe}
        </Link>
      </div>
    )
  }

  const placeLabel =
    booking.placeType === 'home'
      ? 'בית'
      : booking.placeType === 'hotel'
        ? 'מלון'
        : 'משרד'

  return (
    <div className="max-w-lg mx-auto px-4 py-10 lg:py-16 animate-glam-rise">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(152_40%_92%)] text-[hsl(152_40%_32%)] mb-4">
          <CheckCircle2 size={36} />
        </div>
        <p className="font-glam text-3xl text-foreground mb-1">ההזמנה אושרה</p>
        <p className="text-muted-foreground text-sm">
          {booking.professionalName} בדרך אליכם · {BRAND.nameHe}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <Sparkles className="text-[hsl(350_38%_55%)] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs text-muted-foreground">שירות</p>
            <p className="font-bold">{booking.serviceName}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="text-muted-foreground shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs text-muted-foreground">מועד</p>
            <p className="font-semibold">{booking.timeSlot}</p>
            {booking.etaMinutes ? (
              <p className="text-xs text-[hsl(152_40%_32%)] mt-0.5">
                הגעה משוערת ≈ {booking.etaMinutes} דק׳
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="text-muted-foreground shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs text-muted-foreground">{placeLabel}</p>
            <p className="font-semibold">{booking.address}</p>
          </div>
        </div>
        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="text-sm text-muted-foreground">שולם</span>
          <span className="font-black text-lg">₪{booking.total}</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mb-6">
        מספר הזמנה: {booking.id}
      </p>

      <div className="flex flex-col gap-2">
        <Link
          href={routes.professionals}
          className="rounded-2xl bg-[hsl(20_14%_12%)] text-white text-center py-3.5 text-sm font-bold"
        >
          הזמנה נוספת
        </Link>
        <Link
          href={routes.home}
          className="rounded-2xl border border-border text-center py-3.5 text-sm font-semibold"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}

export default function BookSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-muted border-t-[hsl(350_38%_55%)] rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
