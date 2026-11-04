import { normalizePhone } from '@/lib/prospects/phone'

/**
 * PostgREST `or` filter that finds the same Israeli number across the formats
 * people actually type: 0501234567, 050-123-4567, +972-50-123-4567.
 * The caller still confirms with phonesMatch so a loose pattern cannot win.
 */
export function waitlistPhoneLookupFilter(phone: string): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized?.startsWith('972') || normalized.length < 11) return null
  const local = `0${normalized.slice(3)}`
  if (local.length < 9) return null
  const head = local.slice(0, 3)
  const mid = local.slice(3, 6)
  const tail = local.slice(6)
  const intlHead = normalized.slice(0, 3)
  const intlRest = local.slice(1, 3)
  return [
    `phone.ilike.%${head}%${mid}%${tail}%`,
    `phone.ilike.%${intlHead}%${intlRest}%${mid}%${tail}%`,
    `phone.eq.${local}`,
    `phone.eq.${normalized}`,
  ].join(',')
}
