'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapPin, Radio } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'

type ProLocationSharingProps = {
  requestId: string
  active: boolean
}

export default function ProLocationSharing({
  requestId,
  active,
}: ProLocationSharingProps) {
  const { t } = useLocale()
  const [sharing, setSharing] = useState(false)
  const [lastSent, setLastSent] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sendPosition = useCallback(
    async (lat: number, lng: number) => {
      const res = await fetch(`/api/requests/${requestId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'שגיאה')
      }
      setLastSent(new Date())
      setError(null)
    },
    [requestId]
  )

  useEffect(() => {
    if (!active || !sharing || typeof navigator === 'undefined') return

    if (!navigator.geolocation) {
      setError(t('tracking.geoUnsupported'))
      setSharing(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        void sendPosition(pos.coords.latitude, pos.coords.longitude)
      },
      () => setError(t('tracking.geoDenied')),
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [active, sharing, sendPosition, t])

  if (!active) return null

  return (
    <div className="bg-info/10 border-2 border-info rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Radio className="text-info" size={20} />
        <p className="font-bold text-foreground">{t('tracking.proShareTitle')}</p>
      </div>
      <p className="text-sm text-foreground/80">{t('tracking.proShareHint')}</p>

      {!sharing ? (
        <button
          type="button"
          onClick={() => setSharing(true)}
          className="w-full bg-info text-info-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <MapPin size={18} />
          {t('tracking.startSharing')}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-success flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {t('tracking.sharingLive')}
          </span>
          <button
            type="button"
            onClick={() => setSharing(false)}
            className="text-sm text-foreground/70 underline"
          >
            {t('tracking.stopSharing')}
          </button>
        </div>
      )}

      {lastSent && sharing && (
        <p className="text-xs text-muted-foreground">
          {t('tracking.lastUpdate')}: {lastSent.toLocaleTimeString()}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
