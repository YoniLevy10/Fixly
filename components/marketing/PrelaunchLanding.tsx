'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import type { HTMLAttributes } from 'react'
import { CheckCircle2, Home, Sparkles, Wrench } from 'lucide-react'
import { getStoredReferral } from '@/components/shared/ReferralCapture'
import { track } from '@/lib/analytics/track'
import type { WaitlistAudience } from '@/lib/data/pro-waitlist-store'

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

export default function PrelaunchLanding() {
  const [audience, setAudience] = useState<WaitlistAudience>('customer')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          audience,
          source: 'prelaunch_landing',
          referralCode: getStoredReferral(),
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || 'לא הצלחנו לשמור את הפרטים')
      }
      track('waitlist_submitted', { audience })
      setDone(true)
      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="prelaunch-root min-h-screen overflow-x-hidden text-[#0f2342]" dir="rtl">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,#dbe7f5_0%,transparent_55%),radial-gradient(ellipse_at_90%_10%,#fde7c4_0%,transparent_45%),linear-gradient(180deg,#f4f7fb_0%,#eef3f9_42%,#f8fafc_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23123563\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="#waitlist" className="text-sm font-bold text-[#123563]/underline-offset-4 hover:underline">
          הרשמה מוקדמת
        </a>
        <p className="text-xs font-semibold text-slate-500 sm:text-sm">נפתח בקרוב בישראל</p>
      </header>

      {/* Hero — one composition: brand, headline, sentence, CTA, visual */}
      <section className="relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-6xl items-center gap-10 px-5 pb-16 pt-4 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-8">
        <div
          className={`transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <p className="mb-3 font-black tracking-tight text-[#123563] text-[clamp(2.75rem,8vw,4.75rem)] leading-none">
            Fixly
            <span className="text-[#F59E0B]">.</span>
          </p>
          <h1 className="max-w-xl text-[clamp(1.35rem,3.6vw,2rem)] font-extrabold leading-snug text-[#1a2f4d]">
            תיקונים ואנשי מקצוע — בלי לרדוף אחרי אף אחד
          </h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-slate-600 sm:text-lg">
            הירשמו לפני הפתיחה וקבלו גישה מוקדמת — בין אם אתם מחפשים בעל מקצוע ובין אם אתם בעלי מקצוע שמחפשים עבודה.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#waitlist"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#123563] px-6 text-base font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#0c294f] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#123563]/30"
            >
              הצטרפו לרשימה
            </a>
            <a
              href="#how"
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-base font-bold text-[#123563] transition hover:bg-white/60"
            >
              איך זה עובד
            </a>
          </div>
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

      <section id="how" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">בקשה אחת. התאמה. מעקב עד סיום.</h2>
        <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">
          Fixly מחברת בין לקוחות לבעלי מקצוע מאומתים — ומלווה את העבודה עד שהכול סגור.
        </p>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            { icon: Home, title: 'מתארים את התקלה', text: 'בלי עשרות טלפונים — בקשה אחת ברורה.' },
            { icon: Wrench, title: 'מקבלים התאמות', text: 'בעלי מקצוע רלוונטיים לפי תחום ואזור.' },
            { icon: Sparkles, title: 'עוקבים עד הסוף', text: 'סטטוס חי ושקיפות עד שהעבודה מסתיימת.' },
          ].map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              className={`transition-all duration-700 ease-out ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${250 + i * 120}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#123563] text-white">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <p className="text-lg font-black text-[#123563]">{title}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="waitlist" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">הרשמה מוקדמת</h2>
        <p className="mt-3 max-w-xl text-base font-medium text-slate-600">
          בחרו מי אתם — ונעדכן אתכם ברגע שנפתח.
        </p>

        <div className="mt-6 flex gap-2" role="tablist" aria-label="סוג הרשמה">
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
              onClick={() => {
                setAudience(tab.id)
                setDone(false)
                setError(null)
              }}
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

        <div className="mt-6 max-w-lg rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_20px_50px_rgba(18,53,99,0.08)] backdrop-blur-sm sm:p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              <p className="text-xl font-black text-[#123563]">נרשמתם בהצלחה</p>
              <p className="text-sm font-medium text-slate-600">
                נחזור אליכם לקראת הפתיחה
                {audience === 'professional' ? ' עם פרטי הצטרפות לבעלי מקצוע.' : '.'}
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
                {audience === 'customer'
                  ? 'ללקוחות — חינם, בלי התחייבות'
                  : 'לבעלי מקצוע — עדיפות בפיילוט + 3 לידים ראשונים'}
              </p>
              <Field
                label="שם מלא"
                required
                value={form.fullName}
                onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
              />
              <Field
                label="טלפון"
                required
                dir="ltr"
                inputMode="tel"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <Field
                label="אימייל (אופציונלי)"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <Field
                label="עיר"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              {audience === 'professional' && (
                <Field
                  label="תחום (למשל אינסטלציה, חשמל)"
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
                {loading ? 'שולחים…' : 'שמרו אותי לרשימה'}
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-[#123563]/10 bg-white/70 px-5 py-8 text-center text-sm font-medium text-slate-500">
        <p className="font-black text-[#123563]">
          Fixly<span className="text-[#F59E0B]">.</span>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} Fixly · {''}
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  dir?: 'ltr' | 'rtl'
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#123563]">{label}</span>
      <input
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
        {/* soft window light */}
        <ellipse cx="300" cy="90" rx="90" ry="50" fill="#ffffff" opacity="0.08" />
        {/* house */}
        <path
          d="M70 250 L210 140 L350 250 V400 H70 Z"
          fill="#ffffff"
          opacity="0.95"
        />
        <path d="M70 250 L210 140 L350 250" fill="none" stroke="#F59E0B" strokeWidth="10" strokeLinejoin="round" />
        <rect x="165" y="290" width="90" height="110" rx="8" fill="#123563" />
        <rect x="100" y="280" width="48" height="48" rx="6" fill="#dbe7f5" />
        <rect x="272" y="280" width="48" height="48" rx="6" fill="#dbe7f5" />
        {/* floating match chip */}
        <g className="origin-center animate-[prelaunch-float_4.5s_ease-in-out_infinite]">
          <rect x="240" y="70" width="150" height="64" rx="16" fill="url(#warm)" />
          <circle cx="272" cy="102" r="16" fill="#123563" />
          <path d="M266 102 L271 107 L280 96" stroke="#F59E0B" strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="298" y="98" fill="#123563" fontSize="13" fontWeight="800" fontFamily="Heebo, sans-serif">
            התאמה מוכנה
          </text>
          <text x="298" y="116" fill="#123563" fontSize="11" fontWeight="600" fontFamily="Heebo, sans-serif" opacity="0.85">
            אינסטלטור · ת״א
          </text>
        </g>
        {/* pro badge */}
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
        {/* brand mark */}
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
