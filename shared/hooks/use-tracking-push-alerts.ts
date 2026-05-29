'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from '@/lib/i18n/locale-provider'
import { formatEtaMinutes, estimateEtaMinutes } from '@/lib/tracking/eta'
import { notifyLocalOnce, registerPushNotifications } from '@/lib/push/notifications'
import type { LiveTrackingState } from '@/lib/tracking/types'
import { routes } from '@/lib/routes'

type UseTrackingPushAlertsOptions = {
  requestId: string
  professionalName?: string
  enabled: boolean
  tracking: LiveTrackingState | null
}

export function useTrackingPushAlerts({
  requestId,
  professionalName,
  enabled,
  tracking,
}: UseTrackingPushAlertsOptions) {
  const { locale, t } = useLocale()
  const lastDistance = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    void registerPushNotifications()
  }, [enabled])

  useEffect(() => {
    if (!enabled || !tracking?.liveTrackingActive || tracking.proLat == null) return

    const name = professionalName ?? t('tracking.proLocation')
    const path = routes.tracking(requestId)

    notifyLocalOnce(
      `fixly-pro-started-${requestId}`,
      t('tracking.pushStartedTitle'),
      t('tracking.pushStartedBody', { name }),
      path
    )

    const km = tracking.distanceKm
    if (km == null) return

    const eta = estimateEtaMinutes(km)
    const etaText = formatEtaMinutes(locale, eta)

    if (km <= 1.5) {
      notifyLocalOnce(
        `fixly-pro-near-${requestId}`,
        t('tracking.pushNearTitle'),
        t('tracking.pushNearBody', { name, eta: etaText }),
        path
      )
    }

    if (eta <= 10) {
      notifyLocalOnce(
        `fixly-pro-eta-${requestId}`,
        t('tracking.pushEtaTitle'),
        t('tracking.pushEtaBody', { name, eta: etaText }),
        path
      )
    }

    if (lastDistance.current != null && lastDistance.current > 2 && km <= 0.3) {
      notifyLocalOnce(
        `fixly-pro-arrived-${requestId}`,
        t('tracking.pushArrivedTitle'),
        t('tracking.pushArrivedBody', { name }),
        path
      )
    }

    lastDistance.current = km
  }, [
    enabled,
    tracking?.distanceKm,
    tracking?.liveTrackingActive,
    tracking?.proLat,
    professionalName,
    locale,
    requestId,
    t,
  ])
}
