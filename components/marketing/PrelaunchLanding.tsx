'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Lock,
  MapPin,
  Wrench,
} from 'lucide-react'
import {
  getStoredAttribution,
  getStoredReferral,
} from '@/components/shared/ReferralCapture'
import { track } from '@/lib/analytics/track'
import type { WaitlistAudience } from '@/lib/data/pro-waitlist-store'
import { prelaunchCopy as copy } from '@/lib/marketing/prelaunch-copy'
import { PRODUCT_URL } from '@/lib/site-config'

type FormState = {
  fullName: string
  phone: string
  city: string
  category: string
}

const emptyForm: FormState = {
  fullName: '',
  phone: '',
  city: '',
  category: '',
}

const VARIANT = 'landing_v3_lean'

function forceHebrewRtl() {
  document.documentElement.lang = 'he'
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.classList.add('locale-rtl')
  document.documentElement.classList.remove('locale-ltr')
  document.body.dir = 'rtl'
}

export default function PrelaunchLanding() {
  const [audience, setAudience] = useState<WaitlistAudience>('customer')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSticky, setShowSticky] = useState(true)
  const startedRef = useRef(false)
  const waitlistRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    forceHebrewRtl()
    const id = requestAnimationFrame(() => setMounted(true))
    track('waitlist_page_view', { path: window.location.pathname, variant: VARIANT })

    const observer = new MutationObserver(() => {
      if (document.documentElement.getAttribute('dir') !== 'rtl') forceHebrewRtl()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir', 'lang'],
    })

    return () => {
      cancelAnimationFrame(id)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const el = waitlistRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!(entry?.isIntersecting ?? false)),
      { rootMargin: '-10% 0px -35% 0px', threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const markSignupStarted = () => {
    if (startedRef.current) return
    startedRef.current = true
    track('waitlist_signup_started', { audience, variant: VARIANT })
  }

  const switchAudience = (next: WaitlistAudience) => {
    setAudience(next)
    setDone(false)
    setError(null)
    startedRef.current = false
    track('waitlist_audience_switch', { audience: next, variant: VARIANT })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    markSignupStarted()
    try {
      const attribution = getStoredAttribution()
      const referralCode = getStoredReferral()
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          city: form.city || undefined,
          category: audience === 'professional' && form.category ? form.category : undefined,
          audience,
          source: 'prelaunch_landing_v3',
          ...(referralCode ? { referralCode } : {}),
          ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || 'לא הצלחנו לשמור את הפרטים')
      }
      track('waitlist_submitted', { audience, variant: VARIANT })
      track('waitlist_signup_completed', { audience, variant: VARIANT })
      setDone(true)
      setForm(emptyForm)
      startedRef.current = false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בשליחה'
      setError(message)
      track('waitlist_form_error', {
        audience,
        variant: VARIANT,
        message: message.slice(0, 80),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="prelaunch-root min-h-screen overflow-x-hidden bg-[#f7f9fc] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-[#10233f] md:pb-0"
      dir="rtl"
      lang="he"
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="prelaunch-drift absolute -right-28 -top-16 h-72 w-72 rounded-full bg-[#ffd98e]/45 blur-3xl" />
        <div className="prelaunch-drift absolute -left-36 top-[28rem] h-80 w-80 rounded-full bg-[#bfd6f0]/50 blur-3xl [animation-delay:1.4s]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-[#123563]/8 bg-[#f7f9fc]/88 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#top" aria-label="Fixly">
            <span dir="ltr" className="text-2xl font-black tracking-tight text-[#123563]">
              {copy.brand}
              <span className="text-[#F59E0B]">.</span>
            </span>
          </a>
          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'header', variant: VARIANT })}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#123563] px-4 text-sm font-black text-white transition hover:bg-[#0c294f]"
          >
            {copy.primaryCta}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-5xl items-center gap-8 px-5 pb-10 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-14 lg:pt-12">
          <div
            className={`transition-all duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}
          >
            <p className="mb-2 text-xs font-bold text-slate-500 sm:text-sm">{copy.eyebrow}</p>
            <div className="flex justify-start">
              <p
                dir="ltr"
                className="font-black tracking-tight text-[#123563] text-[clamp(2.5rem,7vw,4rem)] leading-none"
              >
                {copy.brand}
                <span className="text-[#F59E0B]">.</span>
              </p>
            </div>
            <h1 className="mt-4 max-w-md text-[clamp(1.35rem,3.8vw,2rem)] font-extrabold leading-snug text-[#1a2f4d]">
              {copy.headline}
            </h1>
            <p className="mt-3 max-w-md text-base font-medium leading-7 text-slate-600">
              {copy.subheadline}
            </p>
            <a
              href="#waitlist"
              onClick={() => track('waitlist_cta_click', { placement: 'hero', variant: VARIANT })}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#123563] px-6 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0c294f]"
            >
              {copy.primaryCta}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </a>
            <p className="mt-3 text-sm font-semibold text-slate-500">{copy.trustLine}</p>
          </div>

          <div
            className={`transition-all delay-100 duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <HeroFlowMock />
          </div>
        </section>

        <section
          id="waitlist"
          ref={waitlistRef}
          className="scroll-mt-20 border-t border-[#123563]/8 bg-white"
        >
          <div className="mx-auto max-w-lg px-5 py-12 sm:px-8 sm:py-14">
            <h2 className="text-2xl font-black text-[#123563]">{copy.waitlistTitle}</h2>
            <p className="mt-2 text-base font-medium text-slate-600">{copy.waitlistLead}</p>

            <div className="mt-6 rounded-2xl border border-[#123563]/10 bg-[#f7f9fc] p-4 sm:p-5">
              <div
                className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1"
                role="tablist"
                aria-label="סוג הרשמה"
              >
                {(
                  [
                    { id: 'customer' as const, label: 'אני לקוח/ה' },
                    { id: 'professional' as const, label: 'אני בעל/ת מקצוע' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={audience === tab.id}
                    onClick={() => switchAudience(tab.id)}
                    className={`min-h-11 rounded-lg px-3 text-sm font-black transition ${
                      audience === tab.id
                        ? 'bg-[#123563] text-white'
                        : 'text-slate-500 hover:text-[#123563]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {done ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden />
                  <p className="text-xl font-black text-[#123563]">{copy.successTitle}</p>
                  <p className="text-sm font-medium text-slate-600">
                    {audience === 'professional' ? copy.successPro : copy.successCustomer}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDone(false)}
                    className="mt-1 text-sm font-bold text-[#123563] underline"
                  >
                    לרשום עוד מישהו
                  </button>
                </div>
              ) : (
                <form className="mt-4 space-y-3.5" onSubmit={submit} onFocus={markSignupStarted}>
                  <p className="text-sm font-semibold text-slate-500">
                    {audience === 'customer' ? copy.customerHint : copy.proHint}
                  </p>
                  <Field
                    label="שם מלא"
                    name="fullName"
                    autoComplete="name"
                    required
                    value={form.fullName}
                    onChange={(v) => {
                      markSignupStarted()
                      setForm((f) => ({ ...f, fullName: v }))
                    }}
                  />
                  <Field
                    label="טלפון"
                    name="phone"
                    autoComplete="tel"
                    required
                    dir="ltr"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(v) => {
                      markSignupStarted()
                      setForm((f) => ({ ...f, phone: v }))
                    }}
                  />
                  {audience === 'professional' && (
                    <Field
                      label="תחום"
                      name="category"
                      placeholder="למשל אינסטלציה"
                      value={form.category}
                      onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    />
                  )}
                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 text-base font-black text-[#123563] transition hover:brightness-105 disabled:opacity-60"
                  >
                    {loading
                      ? 'שולחים…'
                      : audience === 'professional'
                        ? copy.submitPro
                        : copy.submitCustomer}
                    {!loading ? <ArrowLeft className="h-4 w-4" aria-hidden /> : null}
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-slate-500">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    בלי כרטיס אשראי
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-lg px-5 pb-14 pt-2 sm:px-8">
          <h2 className="text-lg font-black text-[#123563]">{copy.faqTitle}</h2>
          <div className="mt-4 space-y-4">
            {copy.faq.map((item) => (
              <div key={item.q}>
                <h3 className="text-sm font-black text-[#10233f]">{item.q}</h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#123563]/10 bg-white px-5 py-6 text-center text-sm font-medium text-slate-500">
        <p className="font-black text-[#123563]" dir="ltr">
          Fixly<span className="text-[#F59E0B]">.</span>
        </p>
        <p className="mt-2">
          <Link href="/privacy" className="underline underline-offset-2">
            פרטיות
          </Link>
          {' · '}
          <Link href="/terms" className="underline underline-offset-2">
            תנאים
          </Link>
          {PRODUCT_URL ? (
            <>
              {' · '}
              <a href={PRODUCT_URL} className="underline underline-offset-2" rel="noopener noreferrer">
                כניסה למערכת
              </a>
            </>
          ) : null}
        </p>
      </footer>

      {showSticky ? (
        <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] z-50 md:hidden">
          <a
            href="#waitlist"
            onClick={() =>
              track('waitlist_cta_click', { placement: 'mobile_sticky', variant: VARIANT })
            }
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#123563] px-5 text-base font-black text-white shadow-[0_16px_40px_rgba(18,53,99,0.32)]"
          >
            {copy.stickyCta}
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </a>
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  dir,
  inputMode,
  name,
  autoComplete,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  dir?: 'ltr' | 'rtl'
  inputMode?: 'tel' | 'email' | 'text'
  name?: string
  autoComplete?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#123563]">{label}</span>
      <input
        name={name}
        autoComplete={autoComplete}
        required={required}
        type={type}
        dir={dir}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#123563]/15 bg-white px-3 py-2.5 text-base font-medium text-[#0f2342] outline-none transition placeholder:text-slate-400 focus:border-[#123563] focus:ring-4 focus:ring-[#123563]/15"
      />
    </label>
  )
}

function HeroFlowMock() {
  return (
    <div
      className="relative mx-auto w-full max-w-md"
      aria-label="הדגמה: זרימת בקשה ב-Fixly"
    >
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-[0_20px_50px_rgba(18,53,99,0.12)] sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <p dir="ltr" className="text-base font-black text-[#123563]">
            Fixly<span className="text-[#F59E0B]">.</span>
          </p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            בקשה פעילה
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-[#f5f8fb] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400">הבקשה שלך</p>
              <p className="mt-1 text-base font-black leading-snug text-[#10233f]">
                המים בכיור לא יורדים
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#123563] shadow-sm">
              <Wrench className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden />
            ירושלים · אינסטלציה
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <StatusRow done title="נשלחה" />
          <StatusRow done title="נמצאה התאמה" />
          <StatusRow active title="בדרך אליכם" />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#10233f] p-3.5 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <BadgeCheck className="h-5 w-5 text-[#ffd07a]" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white/55">התאמה לדוגמה</p>
            <p className="text-sm font-black">בעל מקצוע מאומת</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ done, active, title }: { done?: boolean; active?: boolean; title: string }) {
  return (
    <div className="grid grid-cols-[28px_1fr] items-center gap-3">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
          done
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : active
              ? 'border-[#F59E0B] bg-[#fff7e8] text-[#F59E0B]'
              : 'border-slate-200 bg-white text-slate-300'
        }`}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <div>
        <p className="text-sm font-black text-[#10233f]">{title}</p>
        {active ? (
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#fff1cf]">
            <div className="prelaunch-progress h-full rounded-full bg-[#F59E0B]" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
