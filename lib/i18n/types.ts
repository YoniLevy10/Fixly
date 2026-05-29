export type Locale = 'he' | 'en'

export const LOCALES: Locale[] = ['he', 'en']

export const LOCALE_STORAGE_KEY = 'fixly-locale'

export function isLocale(value: string): value is Locale {
  return value === 'he' || value === 'en'
}

export function localeDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'he' ? 'rtl' : 'ltr'
}

export function localeTag(locale: Locale): string {
  return locale === 'he' ? 'he-IL' : 'en-US'
}
