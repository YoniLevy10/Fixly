/** Normalize Israeli phone numbers to digits starting with 972 (no +). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0') && digits.length >= 9) {
    digits = `972${digits.slice(1)}`
  } else if (digits.startsWith('972')) {
    // already international
  } else if (digits.length === 9 && digits.startsWith('5')) {
    digits = `972${digits}`
  } else if (digits.length >= 9 && !digits.startsWith('972')) {
    // leave as-is for non-IL numbers with country code already
  }

  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const na = normalizePhone(a)
  const nb = normalizePhone(b)
  if (!na || !nb) return false
  return na === nb
}
