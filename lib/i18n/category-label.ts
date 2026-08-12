import { translate } from '@/lib/i18n/translate'
import type { Locale } from '@/lib/i18n/types'
import {
  CATEGORY_CATALOG,
  resolveCategoryNameEn,
  resolveCategoryNameHe,
} from '@/lib/categories/catalog'

export function getCategoryLabel(locale: Locale, slug: string, fallback?: string): string {
  const key = `categories.${slug}`
  const label = translate(locale, key)
  if (label !== key) return label

  const catalog = CATEGORY_CATALOG[slug]
  if (catalog) return locale === 'he' ? catalog.nameHe : catalog.nameEn

  if (fallback) {
    return locale === 'he'
      ? resolveCategoryNameHe(slug, fallback, fallback)
      : resolveCategoryNameEn(slug, fallback, fallback)
  }

  return slug
}
