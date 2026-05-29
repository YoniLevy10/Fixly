'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translate } from '@/lib/i18n/translate'
import {
  isLocale,
  localeDirection,
  LOCALE_STORAGE_KEY,
  type Locale,
} from '@/lib/i18n/types'

type LocaleContextValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'he'
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored && isLocale(stored) ? stored : 'he'
}

function applyDocumentLocale(locale: Locale) {
  const dir = localeDirection(locale)
  document.documentElement.lang = locale
  document.documentElement.dir = dir
  document.body.dir = dir
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('he')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initial = readStoredLocale()
    setLocaleState(initial)
    applyDocumentLocale(initial)
    setReady(true)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
    applyDocumentLocale(next)
  }, [])

  const t = useCallback((key: string) => translate(locale, key), [locale])

  const value = useMemo(
    () => ({
      locale,
      dir: localeDirection(locale),
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  )

  if (!ready) {
    return (
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    )
  }

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
