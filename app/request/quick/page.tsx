'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import BackButton from '@/components/shared/BackButton'
import Textarea from '@/components/ui/Textarea'
import Label from '@/components/ui/Label'
import Input from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import { createRequestApi } from '@/shared/hooks/use-requests-api'
import { routes } from '@/lib/routes'
import { track } from '@/lib/analytics/track'
import { featureFlags } from '@/lib/feature-flags'
import { getStoredReferral } from '@/components/shared/ReferralCapture'
import FixlyGuaranteeBanner from '@/components/shared/FixlyGuaranteeBanner'

export default function QuickRequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLocale()
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(user.location ?? '')
  const [categorySlug, setCategorySlug] = useState('plumbing')
  const [loading, setLoading] = useState(false)

  if (!featureFlags.quickRequest) {
    router.replace(routes.newRequest)
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const created = await createRequestApi({
        customerName: user.fullName,
        customerPhone: user.phone ?? '',
        professionalName: '',
        category: categorySlug,
        categorySlug,
        city: location.split(',')[0]?.trim(),
        title: description.slice(0, 60),
        description,
        location,
        matchMode: true,
        referralCode: getStoredReferral() ?? undefined,
      })
      track('request_created', { quick: true, matchMode: true })
      router.push(routes.tracking(created.id))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <BackButton onClick={() => router.back()} />
        <h1 className="text-xl font-black">{t('improvements.quickRequest')}</h1>
      </div>
      <FixlyGuaranteeBanner compact />
      <form onSubmit={submit} className="space-y-4 mt-4">
        <div>
          <Label>{t('requests.category')}</Label>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="mt-1 w-full border border-border rounded-xl px-3 py-2"
          >
            <option value="plumbing">{t('categories.plumbing')}</option>
            <option value="electricity">{t('categories.electricity')}</option>
            <option value="ac">{t('categories.ac')}</option>
            <option value="cleaning">{t('categories.cleaning')}</option>
            <option value="painting">{t('categories.painting')}</option>
          </select>
        </div>
        <div>
          <Label>{t('requests.description')}</Label>
          <Textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 h-32"
          />
        </div>
        <div>
          <Label>{t('common.address')}</Label>
          <Input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1"
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('matching.waitingBody')}</p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary text-white py-3 rounded-xl font-bold"
        >
          {loading ? t('common.sending') : t('requests.submit')}
        </button>
      </form>
    </div>
  )
}
