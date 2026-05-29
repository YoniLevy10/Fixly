import { en } from '@/lib/i18n/messages/en'
import { he } from '@/lib/i18n/messages/he'
import type { MessageTree } from '@/lib/i18n/messages/types'
import type { Locale } from '@/lib/i18n/types'

export type Messages = MessageTree

const catalogs: Record<Locale, Messages> = { he, en }

export function getMessages(locale: Locale): Messages {
  return catalogs[locale]
}

type Path = string

function resolvePath(obj: Record<string, unknown>, path: Path): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function translate(
  locale: Locale,
  key: Path,
  vars?: Record<string, string | number>
): string {
  let msg = resolvePath(getMessages(locale) as unknown as Record<string, unknown>, key)
  if (!msg) {
    msg = resolvePath(he as unknown as Record<string, unknown>, key)
  }
  const text = msg ?? key
  if (!vars) return text
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    text
  )
}
