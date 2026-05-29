export type LiveTrackingState = {
  destinationLat: number | null
  destinationLng: number | null
  proLat: number | null
  proLng: number | null
  proLocationUpdatedAt: string | null
  liveTrackingActive: boolean
  distanceKm: number | null
  etaMinutes: number | null
  etaLabel: string | null
}
