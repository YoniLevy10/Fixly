/**
 * Lightweight spam / bot rejection for public waitlist inserts.
 * Does not replace rate limits — catches gibberish like the Sep 2026 spam rows.
 */

const HEBREW_OR_LATIN_NAME =
  /^[\u0590-\u05FFa-zA-Z][\u0590-\u05FFa-zA-Z\s'\-.]{1,198}$/u

/** Israeli mobile / landline digits (with optional +972 / separators). */
function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function looksLikeSpamWaitlist(input: {
  fullName: string
  phone: string
  city?: string | null
  category?: string | null
}): string | null {
  const name = input.fullName.trim()
  if (!HEBREW_OR_LATIN_NAME.test(name)) {
    return 'שם לא תקין'
  }
  // Random keyboard smash: long run of consonants / mixed case blob without space
  if (name.length >= 12 && !/\s/.test(name) && !/[\u0590-\u05FF]/.test(name)) {
    const vowels = (name.match(/[aeiouAEIOU]/g) ?? []).length
    if (vowels / name.length < 0.15) return 'שם לא תקין'
  }

  const digits = normalizePhoneDigits(input.phone)
  const ilOk =
    (digits.length === 10 && digits.startsWith('0')) ||
    (digits.length === 9 && /^[2-9]/.test(digits)) ||
    (digits.length === 12 && digits.startsWith('972')) ||
    (digits.length === 11 && digits.startsWith('972'))
  if (!ilOk) {
    return 'מספר טלפון לא תקין'
  }

  for (const field of [input.city, input.category]) {
    if (!field?.trim()) continue
    const v = field.trim()
    if (v.length >= 10 && !/\s/.test(v) && !/[\u0590-\u05FF]/.test(v) && /^[a-zA-Z]+$/.test(v)) {
      return 'פרטים לא תקינים'
    }
  }

  return null
}
