'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/shared/BackButton'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { getStoredReferral } from '@/components/shared/ReferralCapture'
import { useLocale } from '@/lib/i18n/locale-provider'
import { track } from '@/lib/analytics/track'

export default function ProJoinPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    category: '',
    city: '',
  })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/pro/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        referralCode: getStoredReferral(),
      }),
    })
    setLoading(false)
    if (res.ok) {
      track('pro_join_submitted')
      setDone(true)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <BackButton onClick={() => router.back()} />
        <h1 className="text-xl font-black">{t('improvements.proJoinTitle')}</h1>
      </div>
      {done ? (
        <p className="bg-green-50 text-green-800 rounded-2xl p-4 text-center">
          {t('improvements.proJoinSuccess')}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl border p-4">
          <div>
            <Label>{t('auth.fullName')}</Label>
            <Input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('common.phone')}</Label>
            <Input
              required
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('auth.email')}</Label>
            <Input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('home.pickCategory')}</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('common.address')}</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold"
          >
            {loading ? t('common.sending') : t('auth.signUp')}
          </button>
        </form>
      )}
    </div>
  )
}
