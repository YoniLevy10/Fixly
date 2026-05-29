'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'

type BackButtonProps = {
  onClick: () => void
  className?: string
}

export default function BackButton({ onClick, className }: BackButtonProps) {
  const { dir, t } = useLocale()
  const Icon = dir === 'rtl' ? ArrowRight : ArrowLeft

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? 'p-2 rounded-full hover:bg-muted'}
      aria-label={t('common.back')}
    >
      <Icon size={20} />
    </button>
  )
}
