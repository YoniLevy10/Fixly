import { localeTag, type Locale } from '@/lib/i18n/types'

export function formatDate(
  locale: Locale,
  value: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString(localeTag(locale), options)
}
