import { translate } from '@/lib/i18n/translate'
import type { Locale } from '@/lib/i18n/types'

export function getCategoryLabel(locale: Locale, slug: string, fallback?: string): string {
  const key = `categories.${slug}`
  const label = translate(locale, key)
  if (label !== key) return label
  return fallback ?? slug
}
