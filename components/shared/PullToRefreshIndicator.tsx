'use client'

import { useLocale } from '@/lib/i18n/locale-provider'

type PullToRefreshIndicatorProps = {
  pulling: boolean
}

export default function PullToRefreshIndicator({ pulling }: PullToRefreshIndicatorProps) {
  const { t } = useLocale()
  if (!pulling) return null
  return (
    <p className="text-center text-xs text-muted-foreground py-2 animate-pulse">
      {t('improvements.pullRelease')}
    </p>
  )
}
