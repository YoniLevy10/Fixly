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
import { shouldShowPrelaunchLanding } from '@/lib/site-hosts'

type LocaleContextValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const LOCALE_SUGGESTED_KEY = 'fixly-locale-suggested'

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'he'
  const lang = navigator.language?.toLowerCase() ?? ''
  return lang.startsWith('he') ? 'he' : 'en'
}

function isMarketingPath(pathname: string): boolean {
  if (typeof window === 'undefined') {
    return pathname === '/waitlist' || pathname.startsWith('/go/')
  }
  return (
    pathname === '/waitlist' ||
    pathname.startsWith('/go/') ||
    (shouldShowPrelaunchLanding(window.location.host) && pathname === '/')
  )
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'he'
  // Pre-launch / waitlist pages are Hebrew-first acquisition surfaces
  if (isMarketingPath(window.location.pathname)) return 'he'
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && isLocale(stored)) return stored
  if (!localStorage.getItem(LOCALE_SUGGESTED_KEY)) {
    localStorage.setItem(LOCALE_SUGGESTED_KEY, '1')
    return detectBrowserLocale()
  }
  return 'he'
}

function applyDocumentLocale(locale: Locale) {
  const dir = localeDirection(locale)
  document.documentElement.lang = locale
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.classList.toggle('locale-rtl', dir === 'rtl')
  document.documentElement.classList.toggle('locale-ltr', dir === 'ltr')
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

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  )

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
