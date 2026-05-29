import type { MockRequest } from '@/mock/requests'
import { haversineKm } from '@/lib/tracking/geo'
import {
  estimateEtaMinutes,
  formatEtaMinutes,
  interpolatePosition,
} from '@/lib/tracking/eta'

/**
 * Simulates pro driving toward customer for demo/mock mode.
 */
export function getSimulatedTrackingState(
  req: MockRequest,
  locale: string
): {
  proLat: number
  proLng: number
  distanceKm: number
  etaMinutes: number
  etaLabel: string
} | null {
  if (
    !req.liveTrackingActive ||
    req.destinationLat == null ||
    req.destinationLng == null
  ) {
    return null
  }

  const dest = { lat: req.destinationLat, lng: req.destinationLng }
  const start = {
    lat: req.proLat ?? dest.lat + 0.04,
    lng: req.proLng ?? dest.lng + 0.03,
  }

  const cycleMs = 120_000
  const progress = 0.15 + 0.65 * ((Date.now() % cycleMs) / cycleMs)
  const pos = interpolatePosition(start, dest, progress)
  const distanceKm =
    Math.round(haversineKm(pos, dest) * 10) / 10
  const etaMinutes = estimateEtaMinutes(distanceKm)
  const etaLabel = formatEtaMinutes(locale, etaMinutes)

  return {
    proLat: pos.lat,
    proLng: pos.lng,
    distanceKm,
    etaMinutes,
    etaLabel,
  }
}
