'use client'

import { useLocale } from '@/lib/i18n/locale-provider'
import type { Locale } from '@/lib/i18n/types'
import { track } from '@/lib/analytics/track'
import { cn } from '@/lib/utils/cn'

type LanguageToggleProps = {
  className?: string
  compact?: boolean
}

export default function LanguageToggle({ className, compact = true }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale()

  const set = (next: Locale) => {
    setLocale(next)
    track('language_changed', { locale: next })
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => set(locale === 'he' ? 'en' : 'he')}
        className={cn(
          'min-w-[2.5rem] h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-primary',
          className
        )}
        aria-label="Switch language"
      >
        {locale === 'he' ? 'EN' : 'עב'}
      </button>
    )
  }

  return (
    <div className={cn('flex gap-1', className)}>
      {(['he', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          className={cn(
            'px-2 py-1 rounded text-xs font-bold',
            locale === l ? 'bg-primary text-white' : 'bg-gray-100'
          )}
        >
          {l === 'he' ? 'עב' : 'EN'}
        </button>
      ))}
    </div>
  )
}
