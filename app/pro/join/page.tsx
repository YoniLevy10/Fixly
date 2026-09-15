'use client'

import { useState } from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { getStoredReferral } from '@/components/shared/ReferralCapture'
import { useLocale } from '@/lib/i18n/locale-provider'
import { track } from '@/lib/analytics/track'
import { routes } from '@/lib/routes'

/**
 * Professional join — lead-engine / outreach destination.
 * Demand campaign for customers lives at /waitlist (see docs/ACQUISITION_URLS.md).
 */
export default function ProJoinPage() {
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
    <div className="min-h-screen bg-[#f7f9fc] text-[#10233f]" dir="rtl" lang="he">
      <header className="border-b border-[#123563]/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3.5">
          <Link href={routes.waitlist} className="text-xl font-black tracking-tight text-[#123563]" dir="ltr">
            Fixly<span className="text-[#F59E0B]">.</span>
          </Link>
          <span className="rounded-full bg-[#fff7e8] px-2.5 py-1 text-[11px] font-bold text-[#123563]">
            לבעלי מקצוע
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-black text-[#123563]">{t('improvements.proJoinTitle')}</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          השאירו פרטים — נחזור אליכם כשיש התאמה לפיילוט באזור ובתחום שלכם.
        </p>

        {done ? (
          <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-center font-semibold text-emerald-800">
            {t('improvements.proJoinSuccess')}
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="mt-6 space-y-4 rounded-2xl border border-[#123563]/10 bg-white p-5 shadow-sm"
          >
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
                placeholder="למשל אינסטלציה"
              />
            </div>
            <div>
              <Label>{t('common.address')}</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1"
                placeholder="עיר"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#F59E0B] py-3 text-base font-black text-[#123563] disabled:opacity-60"
            >
              {loading ? t('common.sending') : t('auth.signUp')}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs font-semibold text-slate-500">
          מחפשים שירות לבית?{' '}
          <Link href={routes.waitlist} className="font-black text-[#123563] underline underline-offset-2">
            הרשמה מוקדמת ללקוחות
          </Link>
        </p>
      </div>
    </div>
  )
}
