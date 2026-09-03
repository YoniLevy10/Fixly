'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import type { HTMLAttributes } from 'react'
import { CheckCircle2, Home, Lock, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
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
  email: string
  city: string
  category: string
}

const emptyForm: FormState = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  category: '',
}

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
    track('waitlist_page_view', { path: window.location.pathname })

    // LocaleProvider may apply browser English after mount — keep acquisition pages RTL
    const observer = new MutationObserver(() => {
      if (document.documentElement.getAttribute('dir') !== 'rtl') {
        forceHebrewRtl()
      }
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
          track('waitlist_scroll_depth', { depth: mark })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const markSignupStarted = () => {
    if (startedRef.current) return
    startedRef.current = true
    track('waitlist_signup_started', { audience })
  }

  const switchAudience = (next: WaitlistAudience) => {
    setAudience(next)
    setDone(false)
    setError(null)
    startedRef.current = false
    track('waitlist_audience_switch', { audience: next })
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
          email: form.email || undefined,
          city: form.city || undefined,
          category: audience === 'professional' && form.category ? form.category : undefined,
          audience,
          source: 'prelaunch_landing',
          ...(referralCode ? { referralCode } : {}),
          ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || 'לא הצלחנו לשמור את הפרטים')
      }
      track('waitlist_submitted', { audience })
      track('waitlist_signup_completed', { audience })
      setDone(true)
      setForm(emptyForm)
      startedRef.current = false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בשליחה'
      setError(message)
      track('waitlist_form_error', { audience, message: message.slice(0, 80) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="prelaunch-root min-h-screen overflow-x-hidden text-[#0f2342]" dir="rtl" lang="he">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,#cfe0f2_0%,transparent_50%),radial-gradient(ellipse_at_95%_5%,#f6d9a8_0%,transparent_42%),linear-gradient(180deg,#eef4fa_0%,#e8eef6_40%,#f7f9fc_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23123563\' fill-opacity=\'0.07\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a
          href="#waitlist"
          onClick={() => track('waitlist_cta_click', { placement: 'header' })}
          className="text-sm font-bold text-[#123563] underline-offset-4 hover:underline"
        >
          {copy.primaryCta}
        </a>
        <p className="text-xs font-semibold text-slate-500 sm:text-sm">{copy.eyebrow}</p>
      </header>

      {/* Hero — brand + outcome + one CTA group + visual */}
      <section className="relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-6xl items-center gap-10 px-5 pb-14 pt-2 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pb-20 lg:pt-6">
        <div
          className={`transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <p
            dir="ltr"
            className="mb-3 font-black tracking-tight text-[#123563] text-[clamp(2.75rem,8vw,4.75rem)] leading-none"
          >
            {copy.brand}
            <span className="text-[#F59E0B]">.</span>
          </p>
          <h1 className="max-w-xl text-[clamp(1.4rem,3.8vw,2.15rem)] font-extrabold leading-snug text-[#1a2f4d]">
            {copy.headline}
          </h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-slate-600 sm:text-lg">
            {copy.subheadline}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#waitlist"
              onClick={() => track('waitlist_cta_click', { placement: 'hero' })}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#123563] px-6 text-base font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#0c294f] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#123563]/30"
            >
              {copy.primaryCta}
            </a>
            <a
              href="#how"
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-base font-bold text-[#123563] transition hover:bg-white/60"
            >
              {copy.secondaryCta}
            </a>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#123563]" aria-hidden />
              {copy.trustLine}
            </span>
          </p>
        </div>

        <div
          className={`relative transition-all delay-150 duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          aria-hidden
        >
          <HeroVisual />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.howTitle}</h2>
        <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">{copy.howLead}</p>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {copy.howSteps.map((step, i) => {
            const Icon = [Home, Wrench, Sparkles][i] ?? Home
            return (
              <li
                key={step.title}
                className={`transition-all duration-700 ease-out ${
                  mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#123563] text-white">
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <h3 className="text-lg font-black text-[#123563]">{step.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{step.text}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.benefitsTitle}</h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-3">
          {copy.benefits.map((item) => (
            <li key={item.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#F59E0B]">{item.audience}</p>
              <h3 className="mt-2 text-lg font-black text-[#123563]">{item.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'benefits' })}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#123563] px-6 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0c294f]"
          >
            {copy.primaryCta}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.proofTitle}</h2>
        <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">{copy.proofLead}</p>
        <dl className="mt-8 grid grid-cols-3 gap-4 sm:gap-8">
          {copy.proofSlots.map((slot) => (
            <div key={slot.label} className="text-center sm:text-right">
              <dt className="text-xs font-semibold text-slate-500 sm:text-sm">{slot.label}</dt>
              <dd className="mt-1 text-2xl font-black text-[#123563] sm:text-3xl">{slot.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="waitlist" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-10 sm:px-8">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.waitlistTitle}</h2>
        <p className="mt-3 max-w-xl text-base font-medium text-slate-600">{copy.waitlistLead}</p>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="סוג הרשמה">
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
              className={`min-h-11 rounded-xl px-4 text-sm font-bold transition ${
                audience === tab.id
                  ? 'bg-[#123563] text-white'
                  : 'bg-white/80 text-[#123563] ring-1 ring-[#123563]/15 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          id="waitlist-panel"
          role="tabpanel"
          className="mt-6 max-w-lg rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_20px_50px_rgba(18,53,99,0.08)] backdrop-blur-sm sm:p-6"
        >
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              <p className="text-xl font-black text-[#123563]">{copy.successTitle}</p>
              <p className="text-sm font-medium text-slate-600">
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
            <form onSubmit={submit} className="space-y-4">
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
              <Field
                label="אימייל (אופציונלי)"
                name="email"
                autoComplete="email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <Field
                label="עיר (אופציונלי)"
                name="city"
                autoComplete="address-level2"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              {audience === 'professional' && (
                <Field
                  label="תחום (למשל אינסטלציה, חשמל)"
                  name="category"
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
                className="inline-flex w-full min-h-12 items-center justify-center rounded-xl bg-[#F59E0B] px-6 text-base font-black text-[#123563] transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? 'שולחים…' : copy.submitLabel}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-slate-500">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                בלי כרטיס אשראי · אפשר להסיר בכל עת
              </p>
            </form>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.faqTitle}</h2>
        <div className="mt-8 max-w-3xl space-y-6">
          {copy.faq.map((item) => (
            <div key={item.q}>
              <h3 className="text-base font-black text-[#123563]">{item.q}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-4 text-center sm:px-8">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.finalCtaTitle}</h2>
        <p className="mx-auto mt-3 max-w-lg text-base font-medium text-slate-600">{copy.finalCtaLead}</p>
        <a
          href="#waitlist"
          onClick={() => track('waitlist_cta_click', { placement: 'footer' })}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#123563] px-8 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0c294f]"
        >
          {copy.primaryCta}
        </a>
      </section>

      <footer className="border-t border-[#123563]/10 bg-white/70 px-5 py-8 text-center text-sm font-medium text-slate-500">
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
              <a
                href={PRODUCT_URL}
                className="underline underline-offset-2"
                rel="noopener noreferrer"
              >
                כניסה למערכת
              </a>
            </>
          ) : null}
        </p>
      </footer>
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  dir?: 'ltr' | 'rtl'
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  name?: string
  autoComplete?: string
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#123563]/15 bg-white px-3 py-2.5 text-base font-medium text-[#0f2342] outline-none transition focus:border-[#123563] focus:ring-4 focus:ring-[#123563]/15"
      />
    </label>
  )
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#123563]/15 via-transparent to-[#F59E0B]/25 blur-2xl" />
      <svg
        viewBox="0 0 420 520"
        className="relative h-full w-full drop-shadow-[0_30px_60px_rgba(18,53,99,0.18)]"
        role="img"
        aria-label="איור: בית ובעל מקצוע מתואמים ב-Fixly"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a4a7a" />
            <stop offset="55%" stopColor="#123563" />
            <stop offset="100%" stopColor="#0c294f" />
          </linearGradient>
          <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <rect width="420" height="520" rx="40" fill="url(#sky)" />
        <ellipse cx="300" cy="90" rx="90" ry="50" fill="#ffffff" opacity="0.08" />
        <path d="M70 250 L210 140 L350 250 V400 H70 Z" fill="#ffffff" opacity="0.95" />
        <path
          d="M70 250 L210 140 L350 250"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <rect x="165" y="290" width="90" height="110" rx="8" fill="#123563" />
        <rect x="100" y="280" width="48" height="48" rx="6" fill="#dbe7f5" />
        <rect x="272" y="280" width="48" height="48" rx="6" fill="#dbe7f5" />
        <g className="origin-center animate-[prelaunch-float_4.5s_ease-in-out_infinite]">
          <rect x="240" y="70" width="150" height="64" rx="16" fill="url(#warm)" />
          <circle cx="272" cy="102" r="16" fill="#123563" />
          <path
            d="M266 102 L271 107 L280 96"
            stroke="#F59E0B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <text x="298" y="98" fill="#123563" fontSize="13" fontWeight="800" fontFamily="Heebo, sans-serif">
            התאמה מוכנה
          </text>
          <text
            x="298"
            y="116"
            fill="#123563"
            fontSize="11"
            fontWeight="600"
            fontFamily="Heebo, sans-serif"
            opacity="0.85"
          >
            אינסטלטור · ת״א
          </text>
        </g>
        <g className="origin-center animate-[prelaunch-float_5.2s_ease-in-out_infinite_reverse]">
          <rect x="36" y="360" width="132" height="56" rx="14" fill="#ffffff" />
          <circle cx="64" cy="388" r="14" fill="#123563" />
          <path d="M58 388 h12 M64 382 v12" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          <text x="86" y="385" fill="#123563" fontSize="12" fontWeight="800" fontFamily="Heebo, sans-serif">
            בעל מקצוע
          </text>
          <text x="86" y="401" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="Heebo, sans-serif">
            בדרך אליכם
          </text>
        </g>
        <circle cx="210" cy="455" r="28" fill="#F59E0B" />
        <path
          d="M198 455 L208 465 L226 443"
          stroke="#123563"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
