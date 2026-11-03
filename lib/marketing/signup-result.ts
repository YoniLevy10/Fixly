function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

/** Conversion is allowed only after the API returns the saved row id. */
export function acceptedWaitlistSave(
  httpOk: boolean,
  data: { id?: string } | null,
): data is { id: string } {
  return httpOk && typeof data?.id === 'string' && isUuid(data.id)
}
