/**
 * Lightweight spam / bot rejection for public waitlist inserts.
 * Does not replace rate limits — catches gibberish like the Sep 2026 spam rows.
 */

import { normalizePhone } from '@/lib/prospects/phone'

/** Hebrew, Arabic, Latin, digits, and common name punctuation / spaces. */
const PERSON_NAME =
  /^[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9][\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9\s'"׳״()&.,\-/]{0,198}$/u

const HAS_HEBREW_OR_ARABIC =
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u

/** Israeli national number after stripping leading 0 / 972. */
function isValidIlNational(national: string): boolean {
  // Mobile 05x → 5xxxxxxxx (9)
  if (/^5\d{8}$/.test(national)) return true
  // VoIP 07x → 7xxxxxxxx (9)
  if (/^7\d{8}$/.test(national)) return true
  // Landlines 02/03/04/08/09 → 2/3/4/8/9 + 7 digits (8)
  if (/^[23489]\d{7}$/.test(national)) return true
  return false
}

export function isValidIsraeliWaitlistPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) return false

  let national: string | null = null
  if (digits.startsWith('972')) {
    national = digits.slice(3)
  } else if (digits.startsWith('0')) {
    national = digits.slice(1)
  } else if (digits.length === 8 || digits.length === 9) {
    national = digits
  }

  if (!national || national.length < 7 || national.length > 9) return false
  if (!isValidIlNational(national)) return false

  // normalizePhone is the shared IL digit form used elsewhere; accept when it
  // resolves, or when local landline shapes normalizePhone still keeps.
  const normalized = normalizePhone(phone)
  if (normalized) return true
  // Landlines with 9 local digits (0 + 8) may fail normalizePhone's min-10
  // after 972 rewrite in edge cases — still accept valid national shapes.
  return isValidIlNational(national)
}

export function looksLikeSpamWaitlist(input: {
  fullName: string
  phone: string
  city?: string | null
  category?: string | null
}): string | null {
  const name = input.fullName.trim()
  if (name.length < 2 || !PERSON_NAME.test(name)) {
    return 'שם לא תקין'
  }
  // Random keyboard smash: long Latin consonant blob without space / script
  if (name.length >= 12 && !/\s/.test(name) && !HAS_HEBREW_OR_ARABIC.test(name)) {
    const vowels = (name.match(/[aeiouAEIOU]/g) ?? []).length
    if (vowels / name.length < 0.15) return 'שם לא תקין'
  }

  if (!isValidIsraeliWaitlistPhone(input.phone)) {
    return 'מספר טלפון לא תקין'
  }

  for (const field of [input.city, input.category]) {
    if (!field?.trim()) continue
    const v = field.trim()
    if (
      v.length >= 10 &&
      !/\s/.test(v) &&
      !HAS_HEBREW_OR_ARABIC.test(v) &&
      /^[a-zA-Z]+$/.test(v)
    ) {
      return 'פרטים לא תקינים'
    }
  }

  return null
}
