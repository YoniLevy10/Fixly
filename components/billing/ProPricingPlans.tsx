'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import { monetizationConfig, agorotToIls } from '@/lib/monetization/config'
import { getProPriceDisplayIls } from '@/lib/stripe/checkout'
import { routes } from '@/lib/routes'
import Link from 'next/link'

export default function ProPricingPlans() {
  const { t } = useLocale()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  const handleSubscribe = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setMessage(data.message || data.error || t('monetization.checkoutError'))
    } catch {
      setMessage(t('monetization.checkoutError'))
    } finally {
      setLoading(false)
    }
  }

  const proPrice = getProPriceDisplayIls()
  const leadFee = agorotToIls(monetizationConfig.leadFeeAgorot)

  return (
    <div className="space-y-6">
      {success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-xl p-3">
          {t('monetization.subscribeSuccess')}
        </p>
      )}
      {canceled && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
          {t('monetization.subscribeCanceled')}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-black text-lg">{t('monetization.tierFree')}</h2>
          <p className="text-3xl font-black mt-2">₪0</p>
          <ul className="mt-4 text-sm text-muted-foreground space-y-2">
            <li>
              {t('monetization.freeLeads', {
                count: monetizationConfig.freeLeadCreditsPerMonth,
              })}
            </li>
            <li>
              {t('monetization.thenLeadFee', { amount: leadFee })}
            </li>
          </ul>
        </div>

        <div className="bg-primary/5 rounded-2xl border-2 border-primary p-5">
          <h2 className="font-black text-lg text-primary">{t('monetization.tierPro')}</h2>
          <p className="text-3xl font-black mt-2">
            ₪{proPrice}
            <span className="text-sm font-normal text-muted-foreground">
              /{t('monetization.perMonth')}
            </span>
          </p>
          <ul className="mt-4 text-sm space-y-2">
            <li>{t('monetization.proUnlimitedLeads')}</li>
            <li>{t('monetization.proFeatured')}</li>
            <li>{t('monetization.proDashboard')}</li>
          </ul>
          {user.role === 'professional' ? (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="mt-4 w-full bg-primary text-white py-2.5 rounded-xl font-bold disabled:opacity-60"
            >
              {loading ? '...' : t('monetization.subscribe')}
            </button>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">{t('monetization.claimFirst')}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('monetization.commissionNote', {
          percent: monetizationConfig.commissionBasisPoints / 100,
        })}
      </p>

      {message && <p className="text-sm text-amber-700">{message}</p>}

      <Link href={routes.proJoin} className="text-sm text-primary underline">
        {t('improvements.proJoin')}
      </Link>
    </div>
  )
}
