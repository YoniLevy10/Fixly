'use client'

import { useLocale } from '@/lib/i18n/locale-provider'
import type { Locale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils/cn'

type LanguageSwitcherProps = {
  className?: string
  compact?: boolean
}

export default function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale()

  const options: { value: Locale; label: string }[] = [
    { value: 'he', label: t('common.hebrew') },
    { value: 'en', label: t('common.english') },
  ]

  return (
    <div className={cn('space-y-2', className)}>
      {!compact && (
        <p className="text-sm font-medium text-muted-foreground">{t('common.language')}</p>
      )}
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors',
              locale === opt.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40'
            )}
            aria-pressed={locale === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
