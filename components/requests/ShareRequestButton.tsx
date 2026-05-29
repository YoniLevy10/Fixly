'use client'

import { Share2 } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'
import { track } from '@/lib/analytics/track'
import { trackingDeepLink } from '@/lib/native/deep-link'
import { featureFlags } from '@/lib/feature-flags'

type ShareRequestButtonProps = {
  requestId: string
  title: string
}

export default function ShareRequestButton({ requestId, title }: ShareRequestButtonProps) {
  const { t } = useLocale()
  if (!featureFlags.shareRequest) return null

  const share = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/tracking/${requestId}`
        : trackingDeepLink(requestId)
    const payload = { title: t('improvements.shareTitle'), text: title, url }
    try {
      if (navigator.share) {
        await navigator.share(payload)
      } else {
        await navigator.clipboard.writeText(url)
        alert(t('improvements.linkCopied'))
      }
      track('share_request', { requestId })
    } catch {
      /* cancelled */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex items-center gap-2 text-sm text-primary font-medium"
    >
      <Share2 size={16} />
      {t('improvements.share')}
    </button>
  )
}
