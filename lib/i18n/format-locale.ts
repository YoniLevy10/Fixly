import { localeTag, type Locale } from '@/lib/i18n/types'

export function formatPrice(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}
