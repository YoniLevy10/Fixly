/** Client-side helpers for mobile UX: click locks + geo prefetch. */

export function createSubmitLock() {
  let locked = false
  return {
    tryAcquire(): boolean {
      if (locked) return false
      locked = true
      return true
    },
    release() {
      locked = false
    },
    get locked() {
      return locked
    },
  }
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export type PrefetchedCoords = {
  lat: number
  lng: number
  at: number
}

const GEO_MAX_AGE_MS = 120_000

/** Resolve coords with a short timeout; prefer prefetched/cached values. */
export async function resolveDestinationCoords(options: {
  prefetched?: PrefetchedCoords | null
  locationText?: string
  timeoutMs?: number
  coordsFromLocationText: (text: string) => { lat: number; lng: number }
}): Promise<{ lat: number; lng: number; source: 'prefetch' | 'live' | 'fallback' }> {
  const { prefetched, locationText = '', timeoutMs = 1200, coordsFromLocationText } =
    options

  if (prefetched && Date.now() - prefetched.at < GEO_MAX_AGE_MS) {
    return { lat: prefetched.lat, lng: prefetched.lng, source: 'prefetch' }
  }

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timer = window.setTimeout(
          () => reject(new Error('geo-timeout')),
          timeoutMs,
        )
        navigator.geolocation.getCurrentPosition(
          (p) => {
            window.clearTimeout(timer)
            resolve(p)
          },
          (err) => {
            window.clearTimeout(timer)
            reject(err)
          },
          { timeout: timeoutMs, maximumAge: GEO_MAX_AGE_MS, enableHighAccuracy: false },
        )
      })
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        source: 'live',
      }
    } catch {
      /* fall through */
    }
  }

  const fallback = coordsFromLocationText(locationText)
  return { lat: fallback.lat, lng: fallback.lng, source: 'fallback' }
}

/** Start watching / one-shot geo early so submit is not blocked. */
export function prefetchGeolocation(
  onCoords: (coords: PrefetchedCoords) => void,
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return () => {}
  }
  let cancelled = false
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (cancelled) return
      onCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        at: Date.now(),
      })
    },
    () => {},
    { timeout: 8000, maximumAge: GEO_MAX_AGE_MS, enableHighAccuracy: false },
  )
  return () => {
    cancelled = true
  }
}
