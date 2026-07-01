'use client'

import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'

export default function ReferralSharePanel() {
  const { t } = useLocale()
  const [data, setData] = useState<{ code: string; shareUrl: string; uses: number } | null>(
    null,
  )
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referrals')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data?.code) return null

  const copy = async () => {
    await navigator.clipboard.writeText(data.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Share2 size={18} className="text-primary" />
        <p className="font-bold">{t('referral.title')}</p>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{t('referral.body')}</p>
      <p className="text-xs font-mono bg-white rounded-lg px-3 py-2 mb-2">{data.shareUrl}</p>
      <button
        type="button"
        onClick={copy}
        className="text-sm font-bold text-primary"
      >
        {copied ? t('referral.copied') : t('referral.copy')}
      </button>
      {data.uses > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {t('referral.uses', { count: data.uses })}
        </p>
      )}
    </div>
  )
}
