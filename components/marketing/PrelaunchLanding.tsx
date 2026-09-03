'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Home,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Zap,
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

const VARIANT = 'landing_v2'

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
  const startedRef = useRef(false)
  const scrollMarks = useRef(new Set<number>())

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
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = Math.round((window.scrollY / max) * 100)
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark && !scrollMarks.current.has(mark)) {
          scrollMarks.current.add(mark)
          track('waitlist_scroll_depth', { depth: mark, variant: VARIANT })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
          source: 'prelaunch_landing_v2',
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
      className="prelaunch-root min-h-screen overflow-x-hidden bg-[#f7f9fc] pb-24 text-[#10233f] md:pb-0"
      dir="rtl"
      lang="he"
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="prelaunch-drift absolute -right-28 -top-16 h-72 w-72 rounded-full bg-[#ffd98e]/50 blur-3xl" />
        <div className="prelaunch-drift absolute -left-36 top-[34rem] h-88 w-88 rounded-full bg-[#bfd6f0]/55 blur-3xl [animation-delay:1.4s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,53,99,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(18,53,99,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-[#123563]/8 bg-[#f7f9fc]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#top" className="flex items-center gap-2" aria-label="Fixly">
            <span dir="ltr" className="text-2xl font-black tracking-tight text-[#123563]">
              {copy.brand}
              <span className="text-[#F59E0B]">.</span>
            </span>
            <span className="hidden rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200 sm:inline-flex">
              {copy.eyebrow}
            </span>
          </a>
          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'header', variant: VARIANT })}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#123563] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0c294f]"
          >
            {copy.primaryCta}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero — brand first, then outcome copy + product-flow visual */}
        <section className="relative mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-14">
          <div
            className={`transition-all duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <p
              dir="ltr"
              className="mb-3 font-black tracking-tight text-[#123563] text-[clamp(2.6rem,7.5vw,4.5rem)] leading-none"
            >
              {copy.brand}
              <span className="text-[#F59E0B]">.</span>
            </p>
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-extrabold text-[#123563] sm:text-sm">
              <Sparkles className="h-4 w-4 text-[#F59E0B]" aria-hidden />
              {copy.badge}
            </p>
            <h1 className="max-w-xl text-[clamp(1.55rem,4.2vw,2.45rem)] font-extrabold leading-snug text-[#1a2f4d]">
              {copy.headline}
              <span className="mt-1 block text-[#123563]">{copy.headlineLine2}</span>
              <span className="mt-1 block text-[#F59E0B]">{copy.headlineAccent}</span>
            </h1>
            <p className="mt-4 max-w-lg text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {copy.subheadline}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#waitlist"
                onClick={() => track('waitlist_cta_click', { placement: 'hero', variant: VARIANT })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#123563] px-6 text-base font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#0c294f] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#123563]/30"
              >
                {copy.primaryCta}
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="#how"
                className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-base font-bold text-[#123563] transition hover:bg-white/70"
              >
                {copy.secondaryCta}
              </a>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-500">
              {copy.trustItems.map((item, i) => {
                const Icon = [ShieldCheck, Clock3, Users][i] ?? ShieldCheck
                return (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-[#123563]" aria-hidden />
                    {item}
                  </li>
                )
              })}
            </ul>
            <div className="mt-6 flex max-w-xl flex-wrap gap-2" aria-label="קטגוריות לדוגמה">
              {copy.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-[#123563]/10 bg-white/80 px-3 py-1 text-xs font-bold text-[#40546e]"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`relative transition-all delay-150 duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <HeroFlowMock />
          </div>
        </section>

        <section className="border-y border-[#123563]/10 bg-[#10233f] text-white" aria-label="מה Fixly לא">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8">
            {copy.differentiators.map((item) => (
              <div key={item.num} className="flex gap-4">
                <span className="text-sm font-black text-[#F59E0B]">{item.num}</span>
                <div>
                  <h2 className="font-black">{item.title}</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-white/65">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-2xl font-black text-[#123563] sm:text-4xl">{copy.howTitle}</h2>
          <p className="mt-3 max-w-2xl text-base font-medium text-slate-600 sm:text-lg">{copy.howLead}</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {copy.howSteps.map((step, i) => {
              const Icon = [Home, Search, Zap][i] ?? Home
              return (
                <li key={step.title}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#123563] text-white">
                    <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </div>
                  <p className="text-xs font-black text-[#F59E0B]">{i + 1}</p>
                  <h3 className="mt-1 text-lg font-black text-[#123563]">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{step.text}</p>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
          <div className="grid overflow-hidden rounded-[1.75rem] border border-[#123563]/10 bg-white lg:grid-cols-2">
            <div className="p-7 sm:p-10">
              <p className="text-xs font-black text-[#123563]">ללקוחות</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-[#10233f] sm:text-3xl">
                {copy.customerTitle}
              </h2>
              <p className="mt-3 text-base font-medium leading-7 text-slate-600">{copy.customerLead}</p>
              <ul className="mt-5 space-y-2.5 text-sm font-bold text-[#40546e]">
                {copy.customerBullets.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#10233f] p-7 text-white sm:p-10">
              <p className="text-xs font-black text-[#ffd07a]">לבעלי מקצוע</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{copy.proTitle}</h2>
              <p className="mt-3 text-base font-medium leading-7 text-white/70">{copy.proLead}</p>
              <a
                href="#waitlist"
                onClick={() => {
                  switchAudience('professional')
                  track('waitlist_cta_click', { placement: 'pro_panel', variant: VARIANT })
                }}
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#F59E0B] px-5 text-sm font-black text-[#10233f] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                {copy.proCta}
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section id="waitlist" className="scroll-mt-20 bg-[#eaf1f8]">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <h2 className="max-w-xl text-3xl font-black tracking-tight text-[#10233f] sm:text-4xl">
                {copy.waitlistTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                {copy.waitlistLead}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#123563]" aria-hidden />
                  בלי התחייבות
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#F59E0B]" aria-hidden />
                  גישה מוקדמת לפיילוט
                </span>
              </div>
            </div>

            <div
              id="waitlist-panel"
              className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_20px_50px_rgba(18,53,99,0.1)] sm:p-7"
            >
              <div
                className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f3f6fa] p-1.5"
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
                    aria-controls="waitlist-panel"
                    onClick={() => switchAudience(tab.id)}
                    className={`min-h-11 rounded-xl px-3 text-sm font-black transition ${
                      audience === tab.id
                        ? 'bg-white text-[#123563] shadow-sm'
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
                  <p className="max-w-sm text-sm font-medium text-slate-600">
                    {audience === 'professional' ? copy.successPro : copy.successCustomer}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDone(false)}
                    className="mt-2 text-sm font-bold text-[#123563] underline"
                  >
                    לרשום עוד מישהו
                  </button>
                </div>
              ) : (
                <form className="mt-5 space-y-4" onSubmit={submit} onFocus={markSignupStarted}>
                  <p className="text-sm font-semibold text-slate-500">
                    {audience === 'customer' ? copy.customerHint : copy.proHint}
                  </p>
                  <Field
                    label="שם מלא"
                    name="fullName"
                    autoComplete="name"
                    required
                    placeholder="איך קוראים לך?"
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
                    placeholder="050-0000000"
                    value={form.phone}
                    onChange={(v) => {
                      markSignupStarted()
                      setForm((f) => ({ ...f, phone: v }))
                    }}
                  />
                  <Field
                    label="עיר (אופציונלי)"
                    name="city"
                    autoComplete="address-level2"
                    placeholder="למשל ירושלים"
                    value={form.city}
                    onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                  />
                  {audience === 'professional' && (
                    <Field
                      label="תחום (למשל אינסטלציה, חשמל)"
                      name="category"
                      placeholder="למשל אינסטלציה"
                      value={form.category}
                      onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    />
                  )}
                  {error && (
                    <p
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                      role="alert"
                    >
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
                    בלי כרטיס אשראי · אפשר להסיר בכל עת
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-center text-2xl font-black text-[#123563] sm:text-3xl">{copy.faqTitle}</h2>
          <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {copy.faq.map((item) => (
              <details key={item.q} className="group p-5 sm:px-6">
                <summary className="cursor-pointer list-none text-base font-black text-[#10233f] marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-xl font-black text-[#F59E0B] transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 pt-2 text-center sm:px-8">
          <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.finalCtaTitle}</h2>
          <p className="mx-auto mt-3 max-w-lg text-base font-medium text-slate-600">{copy.finalCtaLead}</p>
          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'footer', variant: VARIANT })}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#123563] px-8 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0c294f]"
          >
            {copy.primaryCta}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </a>
        </section>
      </main>

      <footer className="border-t border-[#123563]/10 bg-white/80 px-5 py-8 text-center text-sm font-medium text-slate-500">
        <p className="font-black text-[#123563]" dir="ltr">
          Fixly<span className="text-[#F59E0B]">.</span>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} Fixly ·{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            פרטיות
          </Link>
          {' · '}
          <Link href="/terms" className="underline underline-offset-2">
            תנאים
          </Link>
          {' · '}
          <Link href="/about" className="underline underline-offset-2">
            אודות
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

      <div className="fixed inset-x-3 bottom-3 z-50 md:hidden">
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
      className="relative mx-auto w-full max-w-md py-4 lg:max-w-none"
      aria-label="הדגמה: זרימת בקשה ב-Fixly"
    >
      <div className="absolute inset-x-8 top-10 h-[75%] rounded-[2.5rem] bg-[#123563]/12 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-[0_28px_70px_rgba(18,53,99,0.16)] sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-400">ככה זה ירגיש</p>
            <p dir="ltr" className="mt-1 text-lg font-black text-[#123563]">
              Fixly<span className="text-[#F59E0B]">.</span>
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            בקשה פעילה
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-[#f5f8fb] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400">הבקשה שלך</p>
              <p className="mt-1 text-lg font-black text-[#10233f]">המים בכיור לא יורדים</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#123563] shadow-sm">
              <Wrench className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
            <MapPin className="h-4 w-4 text-[#F59E0B]" aria-hidden />
            ירושלים · אינסטלציה
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <StatusRow done title="הבקשה נשלחה" subtitle="קיבלנו את הפרטים" />
          <StatusRow done title="נמצאה התאמה" subtitle="בעל מקצוע רלוונטי באזור" />
          <StatusRow active title="בדרך אליך" subtitle="השלב הבא מופיע כאן בזמן אמת" />
        </div>

        <div className="mt-6 rounded-2xl bg-[#10233f] p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <BadgeCheck className="h-5 w-5 text-[#ffd07a]" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold text-white/55">התאמה לדוגמה</p>
                <p className="mt-0.5 text-sm font-black">בעל מקצוע מאומת</p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white/80">
              באזור שלך
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  done,
  active,
  title,
  subtitle,
}: {
  done?: boolean
  active?: boolean
  title: string
  subtitle: string
}) {
  return (
    <div className="grid grid-cols-[28px_1fr] gap-3">
      <div className="relative flex justify-center">
        <div
          className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
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
      </div>
      <div>
        <p className="text-sm font-black text-[#10233f]">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
        {active ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#fff1cf]">
            <div className="prelaunch-progress h-full rounded-full bg-[#F59E0B]" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
