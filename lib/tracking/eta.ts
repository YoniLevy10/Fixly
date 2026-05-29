/** Urban driving + parking — rough ETA for marketplace MVP */
const DEFAULT_SPEED_KPH = 28
const MIN_ETA_MIN = 3

export function estimateEtaMinutes(
  distanceKm: number,
  speedKph: number = DEFAULT_SPEED_KPH
): number {
  if (distanceKm <= 0) return MIN_ETA_MIN
  const hours = distanceKm / speedKph
  const minutes = Math.ceil(hours * 60)
  return Math.max(MIN_ETA_MIN, minutes)
}

export function formatEtaMinutes(locale: string, minutes: number): string {
  if (minutes < 60) {
    return locale.startsWith('he')
      ? `כ-${minutes} דק׳`
      : `~${minutes} min`
  }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (locale.startsWith('he')) {
    return m > 0 ? `כ-${h} שע׳ ו-${m} דק׳` : `כ-${h} שע׳`
  }
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

export function interpolatePosition(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  progress: number
): { lat: number; lng: number } {
  const t = Math.min(1, Math.max(0, progress))
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  }
}
