'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, MapPin, Sparkles } from 'lucide-react'
import { routes } from '@/lib/routes'
import type { BeautyBooking } from '@/lib/beauty/booking-store'
import { BRAND } from '@/lib/beauty/catalog'

export default function MyRequestsScreen() {
  const [bookings, setBookings] = useState<BeautyBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
      <h1 className="font-glam text-3xl mb-1">ההזמנות שלי</h1>
      <p className="text-sm text-muted-foreground mb-6">
        מעקב אחרי הזמנות {BRAND.nameHe}
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-[hsl(350_38%_55%)] rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">אין הזמנות עדיין</h2>
          <p className="text-muted-foreground mb-4">
            בחרו בעל מקצוע והזמינו שירות עד הבית
          </p>
          <Link
            href={routes.professionals}
            className="inline-block mt-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-bold"
          >
            צפו בזמינים
          </Link>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={routes.bookSuccess(b.id)}
              className="block bg-card rounded-3xl border border-border p-4 hover:border-[hsl(350_30%_70%)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold">{b.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{b.professionalName}</p>
                </div>
                <span className="text-xs font-bold text-[hsl(152_40%_32%)] bg-[hsl(152_40%_94%)] px-2 py-1 rounded-full">
                  אושר
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {b.address}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles size={12} />
                  ₪{b.total}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
