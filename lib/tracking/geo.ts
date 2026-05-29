/** Rough city centers for demo when only text address exists */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'תל אביב': { lat: 32.0853, lng: 34.7818 },
  'תל אביב-יפו': { lat: 32.0853, lng: 34.7818 },
  'חיפה': { lat: 32.794, lng: 34.9896 },
  'ירושלים': { lat: 31.7683, lng: 35.2137 },
  'באר שבע': { lat: 31.2518, lng: 34.7915 },
  'פתח תקווה': { lat: 32.084, lng: 34.8878 },
  'ראשון לציון': { lat: 31.973, lng: 34.7925 },
}

const DEFAULT = CITY_COORDS['תל אביב']

export function coordsFromLocationText(location?: string): {
  lat: number
  lng: number
} {
  if (!location) return DEFAULT
  const normalized = location.trim()
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(city)) return coords
  }
  return DEFAULT
}

export type LatLng = { lat: number; lng: number }

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function isTrackingStatus(status: string): boolean {
  return status === 'on_the_way' || status === 'in_progress'
}
