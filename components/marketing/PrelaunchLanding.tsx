'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Home,
  Lock,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import {
  getStoredAttribution,
  getStoredReferral,
} from '@/components/shared/ReferralCapture'
import { track } from '@/lib/analytics/track'
import type { WaitlistAudience } from '@/lib/data/pro-waitlist-store'
import { prelaunchCopy as copy } from '@/lib/marketing/prelaunch-copy'
import {
  buildWaitlistShareMessage,
  buildWaitlistShareUrl,
  buildWaitlistWhatsAppShareUrl,
} from '@/lib/marketing/waitlist-share'
import { PRODUCT_URL } from '@/lib/site-config'
import {
  WAITLIST_MAX_PROFESSIONS,
  WAITLIST_PROFESSION_OPTIONS,
} from '@/lib/waitlist/profession-options'

type FormState = {
  fullName: string
  phone: string
  city: string
  categories: string[]
}

const emptyForm: FormState = {
  fullName: '',
  phone: '',
  city: '',
  categories: [],
}

/** Bump when shipping measurable CRO changes — filter in GA4 / Meta */
const VARIANT = 'landing_v5'

function forceHebrewRtl() {
  document.documentElement.lang = 'he'
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.classList.add('locale-rtl')
  document.documentElement.classList.remove('locale-ltr')
  document.body.dir = 'rtl'
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export default function PrelaunchLanding({
  /** Kept for URL compatibility; recruitment mode is professionals-only. */
  initialAudience: _initialAudience = 'professional',
}: {
  initialAudience?: WaitlistAudience
}) {
  const audience: WaitlistAudience = 'professional'
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSticky, setShowSticky] = useState(true)
  const [shareCopied, setShareCopied] = useState(false)
  const startedRef = useRef(false)
  const scrollMarks = useRef(new Set<number>())
  const waitlistRef = useRef<HTMLDivElement | null>(null)

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

  const shareWaitlist = async (channel: 'whatsapp' | 'native' | 'copy') => {
    track('waitlist_share_click', { audience, channel, variant: VARIANT })
    const message = buildWaitlistShareMessage(audience)
    const url = buildWaitlistShareUrl(audience)

    if (channel === 'whatsapp') {
      window.open(buildWaitlistWhatsAppShareUrl(audience), '_blank', 'noopener,noreferrer')
      return
    }

    if (channel === 'native' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Fixly', text: message, url })
        return
      } catch {
        // cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2500)
    } catch {
      window.prompt('העתיקו את הקישור:', url)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.categories.length === 0) {
      setError('בחרו לפחות תחום מקצוע אחד')
      return
    }
    setLoading(true)
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
          categories: form.categories,
          audience: 'professional',
          source: 'waitlist_landing_v5_professional',
          ...(referralCode ? { referralCode } : {}),
          ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
        }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: string; id?: string; ok?: boolean }
        | null
      if (!res.ok) {
        throw new Error(data?.error || 'לא הצלחנו לשמור את הפרטים')
      }
      if (!data?.id || !isUuid(data.id)) {
        throw new Error('השמירה לא אושרה — נסו שוב')
      }
      track('waitlist_submitted', { audience, variant: VARIANT, id: data.id })
      track('waitlist_signup_completed', {
        audience,
        variant: VARIANT,
        id: data.id,
        ...(attribution.utm_source ? { utm_source: attribution.utm_source } : {}),
        ...(attribution.utm_medium ? { utm_medium: attribution.utm_medium } : {}),
        ...(attribution.utm_campaign
          ? { utm_campaign: attribution.utm_campaign }
          : {}),
      })
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

  const selectProfession = (profession: string) => {
    markSignupStarted()
    track('waitlist_cta_click', {
      placement: 'category_chip',
      category: profession,
      variant: VARIANT,
    })
    setForm((current) => {
      if (current.categories.includes(profession)) return current
      if (current.categories.length >= WAITLIST_MAX_PROFESSIONS) return current
      return {
        ...current,
        categories: [...current.categories, profession].sort((a, b) =>
          a.localeCompare(b, 'he'),
        ),
      }
    })
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const formProps: WaitlistFormProps = {
    form,
    loading,
    error,
    done,
    shareCopied,
    onFormChange: setForm,
    onSubmit: submit,
    onSignupStarted: markSignupStarted,
    onShare: shareWaitlist,
    onResetDone: () => {
      setDone(false)
      setShareCopied(false)
    },
  }

  return (
    <div
      className="prelaunch-root min-h-screen overflow-x-hidden ios27-atmosphere pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-[#10233f] md:pb-0"
      dir="rtl"
      lang="he"
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="prelaunch-drift absolute -right-28 -top-16 h-72 w-72 rounded-full bg-secondary/40 blur-3xl" />
        <div className="prelaunch-drift absolute -left-36 top-[34rem] h-88 w-88 rounded-full bg-primary/20 blur-3xl [animation-delay:1.4s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,53,99,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(18,53,99,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
      </div>

      <header className="sticky top-0 z-40 apple-glass pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#top" className="flex items-center gap-2" aria-label="Fixly">
            <span dir="ltr" className="text-2xl font-black tracking-tight text-primary">
              {copy.brand}
              <span className="text-secondary">.</span>
            </span>
            <span className="hidden apple-glass-pill rounded-full px-2.5 py-1 text-[11px] font-bold text-muted-foreground sm:inline-flex">
              {copy.eyebrow}
            </span>
          </a>
          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'header', variant: VARIANT })}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-white shadow-md shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
          >
            {copy.primaryCta}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </header>

      <main id="top">
        {/* Awareness + Action: copy + form above the fold */}
        <section className="relative mx-auto grid max-w-6xl items-start gap-5 px-5 py-5 sm:gap-8 sm:px-8 sm:py-8 lg:grid-cols-[1fr_minmax(300px,400px)] lg:gap-10 lg:py-12">
          <div className="transition-all duration-700 ease-out translate-y-0 opacity-100">
            <div className="hidden justify-start lg:flex">
              <p
                dir="ltr"
                className="mb-2 font-black tracking-tight text-[#123563] text-[clamp(2.4rem,7vw,4rem)] leading-none"
              >
                {copy.brand}
                <span className="text-[#F59E0B]">.</span>
              </p>
            </div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-extrabold text-[#123563] sm:mb-3 sm:text-sm">
              <Sparkles className="h-4 w-4 text-[#F59E0B]" aria-hidden />
              {copy.badge}
            </p>
            <h1 className="max-w-xl text-[clamp(1.45rem,4vw,2.35rem)] font-extrabold leading-snug text-[#1a2f4d]">
              {copy.headline}
              <span className="mt-1 hidden text-[#123563] sm:block">{copy.headlineLine2}</span>
              <span className="mt-1 hidden text-[#F59E0B] sm:block">{copy.headlineAccent}</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
              {copy.subheadline}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-500 sm:mt-5">
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
            <a
              href="#how"
              className="mt-6 hidden text-sm font-bold text-[#123563] underline-offset-4 hover:underline sm:inline-flex lg:mt-8"
            >
              {copy.secondaryCta}
            </a>
          </div>

          <div
            id="waitlist"
            ref={waitlistRef}
            className={`scroll-mt-24 transition-all delay-100 duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <WaitlistFormCard {...formProps} compact />
          </div>
        </section>

        {/* Desire: product flow demo (not competing with hero CTA) */}
        <section className="border-t border-[#123563]/8 bg-white/60 px-5 py-12 sm:px-8 sm:py-16" aria-label="איך זה נראה">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-2xl font-black text-[#123563] sm:text-3xl">{copy.previewTitle}</h2>
              <p className="mt-3 max-w-md text-base font-medium leading-7 text-slate-600">
                {copy.previewLead}
              </p>
            </div>
            <HeroFlowMock />
          </div>
        </section>

        {/* Interest: what Fixly is not */}
        <section className="border-y border-[#123563]/10 bg-[#10233f] text-white" aria-label="למה Fixly">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8">
            {copy.differentiators.map((item) => (
              <div key={item.num} className="flex gap-4">
                <span className="text-sm font-black text-[#F59E0B]">{item.num}</span>
                <div>
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-white/90">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="text-2xl font-black text-[#123563] sm:text-4xl">{copy.howTitle}</h2>
          <p className="mt-3 max-w-2xl text-base font-medium text-slate-600 sm:text-lg">{copy.howLead}</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {copy.howSteps.map((step, i) => {
              const Icon = [Home, Search, Zap][i] ?? Home
              return (
                <li key={step.title}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123563] text-white">
                      <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                    </div>
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#F59E0B]/15 px-2 text-sm font-black tabular-nums text-[#c2410c]">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-black text-[#123563]">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{step.text}</p>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Search intent — actionable category chips */}
        <section className="mx-auto max-w-6xl px-5 pb-6 sm:px-8" aria-label="תחומים">
          <p className="mb-3 text-sm font-bold text-slate-500">{copy.categoriesLabel}</p>
          <div className="flex flex-wrap gap-2">
            {copy.categories.map((category) => {
              const selected = form.categories.includes(category.profession)
              return (
                <button
                  key={category.profession}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectProfession(category.profession)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    selected
                      ? 'border-[#123563] bg-[#123563] text-white'
                      : 'border-[#123563]/12 bg-white text-[#40546e] hover:border-[#123563]/35 hover:text-[#123563]'
                  }`}
                >
                  {selected ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                  {category.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Desire: professionals */}
        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="overflow-hidden rounded-[1.75rem] bg-[#10233f] p-7 text-white sm:p-10">
            <p className="text-xs font-black text-[#ffd07a]">לבעלי מקצוע</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-black tracking-tight text-white sm:text-3xl">
              {copy.proTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-white/90">
              {copy.proLead}
            </p>
          </div>
        </section>

        {/* Trust / objections */}
        <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
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
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                  {item.a}
                  {item.q.includes('בטוחים') ? (
                    <>
                      {' '}
                      <Link href="/privacy" className="font-bold text-[#123563] underline">
                        מדיניות הפרטיות
                      </Link>
                      .
                    </>
                  ) : null}
                </p>
              </details>
            ))}
          </div>
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
          {' · '}
          <Link href="/waitlist" className="underline underline-offset-2">
            הרשמה
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
            className="flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary px-5 text-base font-black text-white shadow-[0_16px_40px_rgba(18,53,99,0.32)]"
          >
            {copy.stickyCta}
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </a>
        </div>
      ) : null}
    </div>
  )
}

type WaitlistFormProps = {
  form: FormState
  loading: boolean
  error: string | null
  done: boolean
  shareCopied: boolean
  compact?: boolean
  onFormChange: (updater: FormState | ((f: FormState) => FormState)) => void
  onSubmit: (e: FormEvent) => void
  onSignupStarted: () => void
  onShare: (channel: 'whatsapp' | 'native' | 'copy') => void
  onResetDone: () => void
}

function WaitlistFormCard({
  form,
  loading,
  error,
  done,
  shareCopied,
  onFormChange,
  onSubmit,
  onSignupStarted,
  onShare,
  onResetDone,
}: WaitlistFormProps) {
  const setField = (key: 'fullName' | 'phone' | 'city', value: string) => {
    onSignupStarted()
    onFormChange((f) => ({ ...f, [key]: value }))
  }

  const toggleCategory = (name: string) => {
    onSignupStarted()
    onFormChange((f) => {
      const selected = f.categories.includes(name)
      if (selected) {
        return { ...f, categories: f.categories.filter((c) => c !== name) }
      }
      if (f.categories.length >= WAITLIST_MAX_PROFESSIONS) return f
      return {
        ...f,
        categories: [...f.categories, name].sort((a, b) =>
          a.localeCompare(b, 'he'),
        ),
      }
    })
  }

  return (
    <div
      id="waitlist-panel"
      className="apple-glass-strong rounded-[var(--radius-xl)] p-5 sm:p-6"
    >
      <h2 className="mb-1 text-center text-sm font-black tracking-wide text-[#123563]">
        {copy.formEyebrow}
      </h2>
      <p className="mb-4 text-center text-xs font-semibold text-slate-500">
        {copy.proHint}
      </p>

      {done ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center sm:py-10">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden />
          <p className="text-xl font-black text-[#123563]">{copy.successTitle}</p>
          <p className="max-w-sm text-sm font-medium text-slate-600">
            {copy.successPro}
          </p>
          <div className="mt-4 w-full max-w-sm rounded-2xl bg-[#f3f6fa] p-4 text-start">
            <p className="text-sm font-black text-[#123563]">{copy.successShareTitle}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{copy.successShareLead}</p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={buildWaitlistWhatsAppShareUrl('professional')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track('waitlist_share_click', {
                    audience: 'professional',
                    channel: 'whatsapp',
                    variant: VARIANT,
                  })
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-black text-white transition hover:brightness-105"
              >
                {copy.successShareWhatsApp}
              </a>
              <button
                type="button"
                onClick={() => onShare('native')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#123563]/15 bg-white px-4 text-sm font-black text-[#123563] transition hover:bg-white/80"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {shareCopied ? copy.successShareCopied : copy.successShareNative}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetDone}
            className="mt-2 text-sm font-bold text-[#123563] underline"
          >
            לרשום עוד מישהו
          </button>
        </div>
      ) : (
        <form className="mt-1 space-y-3.5" onSubmit={onSubmit} onFocus={onSignupStarted}>
          <Field
            label="שם מלא"
            name="fullName"
            autoComplete="name"
            required
            placeholder="איך קוראים לך?"
            value={form.fullName}
            onChange={(v) => setField('fullName', v)}
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
            onChange={(v) => setField('phone', v)}
          />
          <ProfessionMultiSelect
            selected={form.categories}
            onToggle={toggleCategory}
            onRemove={toggleCategory}
          />
          <Field
            label="עיר (אופציונלי)"
            name="city"
            autoComplete="address-level2"
            placeholder="למשל ירושלים"
            value={form.city}
            onChange={(v) => setField('city', v)}
          />
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
            {loading ? 'שולחים…' : copy.submitPro}
            {!loading ? <ArrowLeft className="h-4 w-4" aria-hidden /> : null}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-slate-500">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            בלי כרטיס אשראי · אפשר להסיר בכל עת
          </p>
        </form>
      )}
    </div>
  )
}

function ProfessionMultiSelect({
  selected,
  onToggle,
  onRemove,
}: {
  selected: string[]
  onToggle: (name: string) => void
  onRemove: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const el = rootRef.current
      if (!el) return
      if (event.target instanceof Node && !el.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  const filtered = query.trim()
    ? WAITLIST_PROFESSION_OPTIONS.filter((name) =>
        name.includes(query.trim()),
      )
    : WAITLIST_PROFESSION_OPTIONS

  const atLimit = selected.length >= WAITLIST_MAX_PROFESSIONS

  return (
    <div ref={rootRef} className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#123563]">
        תחומי מקצוע
        <span className="mr-1 font-semibold text-slate-400">(חובה · עד {WAITLIST_MAX_PROFESSIONS})</span>
      </span>

      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onRemove(name)}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-[#123563]/10 px-2.5 py-1 text-xs font-bold text-[#123563]"
            >
              <span className="truncate">{name}</span>
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="sr-only">הסר {name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[46px] items-center justify-between gap-2 rounded-xl border border-[#123563]/15 bg-white px-3 py-2.5 text-start text-base font-medium text-[#0f2342] outline-none transition focus:border-[#123563] focus:ring-4 focus:ring-[#123563]/15"
      >
        <span className={selected.length ? 'text-[#123563]' : 'text-slate-400'}>
          {selected.length
            ? `${selected.length} תחומים נבחרו`
            : 'בחרו תחומים — למשל מזגנים, חשמל…'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-[#123563]/12 bg-white shadow-[0_12px_32px_rgba(18,53,99,0.12)]">
          <div className="border-b border-slate-100 p-2">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש תחום…"
                className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] py-2 pe-3 ps-9 text-sm font-medium outline-none focus:border-[#123563]"
              />
            </label>
          </div>
          <ul
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-y-auto overscroll-contain p-1.5"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm font-medium text-slate-500">
                לא נמצא תחום מתאים
              </li>
            ) : (
              filtered.map((name) => {
                const isOn = selected.includes(name)
                const disabled = !isOn && atLimit
                return (
                  <li key={name} role="option" aria-selected={isOn}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggle(name)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm font-bold transition ${
                        isOn
                          ? 'bg-[#123563]/10 text-[#123563]'
                          : disabled
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-[#40546e] hover:bg-[#f3f6fa]'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          isOn
                            ? 'border-[#123563] bg-[#123563] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                        aria-hidden
                      >
                        {isOn ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </span>
                      {name}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
          {atLimit ? (
            <p className="border-t border-slate-100 px-3 py-2 text-xs font-semibold text-amber-700">
              הגעתם למקסימום {WAITLIST_MAX_PROFESSIONS} תחומים
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-1.5 text-xs font-medium text-slate-500">
        אפשר לבחור כמה תחומים — למשל מזגנים וגם חשמל.
      </p>
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
      className="relative mx-auto w-full max-w-md py-2 sm:py-0 lg:max-w-none"
      aria-label="הדגמה: עבודה שנכנסת לבעל מקצוע"
    >
      <div className="absolute inset-x-8 top-8 hidden h-[75%] rounded-[2.5rem] bg-[#123563]/12 blur-3xl sm:block" />
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-[0_20px_50px_rgba(18,53,99,0.12)] sm:rounded-[1.75rem] sm:p-6 sm:shadow-[0_28px_70px_rgba(18,53,99,0.16)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">עבודה לדוגמה</p>
            <p dir="ltr" className="mt-1 text-base font-black text-[#123563] sm:text-lg">
              Fixly<span className="text-[#F59E0B]">.</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            עבודה חדשה
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-[#f5f8fb] p-3.5 sm:mt-5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400">נכנסה אליכם</p>
              <p className="mt-1 text-base font-black leading-snug text-[#10233f] sm:text-lg">
                אינסטלציה · ירושלים
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#123563] shadow-sm sm:h-11 sm:w-11">
              <Wrench className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden />
            סתימה בכיור · היום
          </div>
        </div>

        <div className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
          <StatusRow done title="העבודה נכנסה" subtitle="בתחום ובאזור שלכם" />
          <StatusRow done title="שובצתם" subtitle="אתם ההתאמה לעבודה הזו" />
          <StatusRow active title="בדרך לסגירה" subtitle="הסטטוס מתעדכן עד הסוף" />
        </div>

        <div className="mt-5 rounded-2xl bg-[#10233f] p-3.5 text-white sm:mt-6 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-11 sm:w-11">
                <BadgeCheck className="h-5 w-5 text-[#ffd07a]" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white/85">העבודה אצלכם</p>
                <p className="mt-0.5 truncate text-sm font-black">אינסטלציה · ירושלים</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white/80">
              פתוחה
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
