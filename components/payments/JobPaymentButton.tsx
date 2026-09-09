'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { useLocale } from '@/lib/i18n/locale-provider'
import { formatPrice } from '@/lib/i18n/format-locale'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { writeTourRequest, readTourRequest } from '@/lib/demo/tour-session'
import type { MockRequest } from '@/mock/requests'

type JobPaymentButtonProps = {
  requestId: string
  amountIls?: number
  paymentStatus?: string
  onPaid?: (request: MockRequest) => void
}

export default function JobPaymentButton({
  requestId,
  amountIls,
  paymentStatus,
  onPaid,
}: JobPaymentButtonProps) {
  const { t, locale } = useLocale()
  const [loading, setLoading] = useState(false)
  const [localPaid, setLocalPaid] = useState(paymentStatus === 'paid')

  if (localPaid || paymentStatus === 'paid') {
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
      if (isDemoDataMode()) {
        const res = await fetch('/api/demo/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId }),
        })
        const json = await res.json()
        if (!res.ok) {
          alert(json.error ?? t('payment.error'))
          return
        }
        const paidRequest = json.request as MockRequest
        setLocalPaid(true)
        const tour = readTourRequest(requestId)
        if (tour) {
          writeTourRequest({ ...tour, ...paidRequest, paymentStatus: 'paid' })
        }
        // Multi-isolate: push paid snapshot so tracking reloads stay green
        void fetch('/api/demo/requests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paidRequest),
        }).catch(() => {})
        onPaid?.(paidRequest)
        return
      }

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
