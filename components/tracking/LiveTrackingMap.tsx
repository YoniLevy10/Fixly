'use client'

import { useEffect, useRef } from 'react'
import type { LiveTrackingState } from '@/lib/tracking/types'
import { useLocale } from '@/lib/i18n/locale-provider'

type LiveTrackingMapProps = {
  tracking: LiveTrackingState
  className?: string
}

export default function LiveTrackingMap({ tracking, className = '' }: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<{
    pro?: import('leaflet').CircleMarker
    dest?: import('leaflet').CircleMarker
  }>({})
  const { t } = useLocale()

  const dest =
    tracking.destinationLat != null && tracking.destinationLng != null
      ? { lat: tracking.destinationLat, lng: tracking.destinationLng }
      : null
  const pro =
    tracking.proLat != null && tracking.proLng != null
      ? { lat: tracking.proLat, lng: tracking.proLng }
      : null

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return

    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return

      if (!mapInstance.current) {
        const center = pro ?? dest ?? { lat: 32.0853, lng: 34.7818 }
        mapInstance.current = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([center.lat, center.lng], 14)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(mapInstance.current)
      }

      const map = mapInstance.current

      if (dest) {
        if (!markersRef.current.dest) {
          markersRef.current.dest = L.circleMarker([dest.lat, dest.lng], {
            radius: 12,
            color: '#123563',
            fillColor: '#123563',
            fillOpacity: 1,
            weight: 3,
          })
            .addTo(map)
            .bindPopup(t('tracking.destination'))
        } else {
          markersRef.current.dest.setLatLng([dest.lat, dest.lng])
        }
      }

      if (pro) {
        if (!markersRef.current.pro) {
          markersRef.current.pro = L.circleMarker([pro.lat, pro.lng], {
            radius: 14,
            color: '#F59E0B',
            fillColor: '#F59E0B',
            fillOpacity: 1,
            weight: 4,
          })
            .addTo(map)
            .bindPopup(t('tracking.proLocation'))
        } else {
          markersRef.current.pro.setLatLng([pro.lat, pro.lng])
        }
      }

      const points: [number, number][] = []
      if (dest) points.push([dest.lat, dest.lng])
      if (pro) points.push([pro.lat, pro.lng])
      if (points.length >= 2) {
        map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 })
      } else if (points.length === 1) {
        map.setView(points[0], 14)
      }
    })

    return () => {
      cancelled = true
    }
  }, [dest?.lat, dest?.lng, pro?.lat, pro?.lng, t])

  useEffect(() => {
    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
      markersRef.current = {}
    }
  }, [])

  return (
    <div className={className}>
      <div
        ref={mapRef}
        className="w-full h-64 rounded-2xl border-2 border-border overflow-hidden z-0"
        aria-label={t('tracking.mapLabel')}
      />
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {tracking.etaLabel && (
          <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-sm font-black px-4 py-2 rounded-full shadow-md">
            {t('tracking.eta')}: {tracking.etaLabel}
          </span>
        )}
        {tracking.distanceKm != null && (
          <span className="inline-flex text-sm font-bold text-foreground bg-muted px-3 py-2 rounded-full">
            {t('tracking.distanceKm', { km: tracking.distanceKm })}
          </span>
        )}
      </div>
    </div>
  )
}
