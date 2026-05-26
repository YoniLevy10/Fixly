type AvailabilityInput = {
  activeRequests: number
  maxCapacity: number
}

export function isProfessionalAvailable({
  activeRequests,
  maxCapacity,
}: AvailabilityInput) {
  return activeRequests < maxCapacity
}
