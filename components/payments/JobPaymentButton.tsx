'use client'

import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'
import { formatPrice } from '@/lib/i18n/format-locale'

type JobPaymentButtonProps = {
  requestId: string
  amountIls?: number
  paymentStatus?: string
}

export default function JobPaymentButton({
  requestId,
  amountIls,
  paymentStatus,
}: JobPaymentButtonProps) {
  const { t, locale } = useLocale()
  const [loading, setLoading] = useState(false)

  if (paymentStatus === 'paid') {
    return (
      <p className="text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl p-3 text-center">
        {t('payment.paid')}
      </p>
    )
  }

  if (!amountIls || amountIls <= 0) return null

  const pay = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/job-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else alert(json.error ?? json.message ?? t('payment.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={pay}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm disabled:opacity-60"
    >
      <CreditCard size={18} />
      {loading
        ? '...'
        : t('payment.payNow', { amount: formatPrice(locale, amountIls) })}
    </button>
  )
}
