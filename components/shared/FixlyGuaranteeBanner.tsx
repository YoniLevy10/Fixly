'use client'

import { Shield } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function FixlyGuaranteeBanner({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale()

  if (compact) {
    return (
      <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
        <Shield size={14} className="shrink-0" />
        {t('trust.guaranteeShort')}
      </p>
    )
  }

  return (
    <div className="bg-gradient-to-l from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Shield size={20} />
        </div>
        <div>
          <p className="font-bold text-emerald-900">{t('trust.guaranteeTitle')}</p>
          <p className="text-sm text-emerald-800 mt-1">{t('trust.guaranteeBody')}</p>
        </div>
      </div>
    </div>
  )
}
