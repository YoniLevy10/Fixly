'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  Wrench,
  X,
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
const VARIANT = 'landing_v6'

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

  const trustIcons = [ShieldCheck, CreditCard, MapPin]

  return (
    <div
      className="prelaunch-root min-h-screen overflow-x-hidden bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-foreground md:pb-0"
      dir="rtl"
      lang="he"
    >
      {/* Soft warm wash — no blob/grid excess */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 100% 0%, color-mix(in srgb, hsl(var(--secondary)) 8%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 0% 20%, color-mix(in srgb, hsl(var(--primary)) 6%, transparent), transparent 50%), hsl(var(--background))',
        }}
      />

      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#top" className="flex items-center gap-2" aria-label="Fixly">
            <span dir="ltr" className="text-2xl font-extrabold tracking-tight text-primary">
              {copy.brand}
              <span className="text-secondary">.</span>
            </span>
            <span className="hidden rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground sm:inline-flex">
              {copy.eyebrow}
            </span>
          </a>
          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'header', variant: VARIANT })}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-extrabold text-secondary-foreground shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {copy.primaryCta}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </header>

      <main id="top">
        <section className="relative mx-auto grid max-w-6xl items-start gap-8 px-5 py-8 sm:gap-10 sm:px-8 sm:py-12 lg:grid-cols-[1.05fr_minmax(300px,400px)] lg:gap-12 lg:py-16">
          <div
            className={`transition-all duration-[var(--dur-3)] ease-[var(--ease)] ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <p
              dir="ltr"
              className="mb-3 font-extrabold tracking-tight text-primary text-[clamp(2rem,8vw,3.5rem)] leading-none"
            >
              {copy.brand}
              <span className="text-secondary">.</span>
            </p>
            <p className="mb-3 text-xs font-bold text-muted-foreground sm:text-sm">
              {copy.badge}
            </p>
            <h1 className="max-w-xl text-[clamp(1.65rem,5.5vw,2.75rem)] font-extrabold leading-[1.2] tracking-tight text-foreground">
              <span className="block">{copy.headline}</span>
              <span className="mt-1 block text-primary">{copy.headlineLine2}</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] font-medium leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {copy.subheadline}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#waitlist"
                onClick={() =>
                  track('waitlist_cta_click', { placement: 'hero_primary', variant: VARIANT })
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-base font-extrabold text-secondary-foreground shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copy.primaryCta}
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="#how"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-5 text-base font-bold text-primary transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copy.secondaryCta}
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5 text-sm font-bold text-muted-foreground">
              {copy.trustItems.map((item, i) => {
                const Icon = trustIcons[i] ?? ShieldCheck
                return (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    {item}
                  </li>
                )
              })}
            </ul>

            <DemoOpportunityCard className="mt-8 hidden sm:block lg:hidden" />
          </div>

          <div className="space-y-4">
            <div
              id="waitlist"
              ref={waitlistRef}
              className={`scroll-mt-24 transition-all delay-75 duration-[var(--dur-3)] ease-[var(--ease)] ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
            >
              <WaitlistFormCard {...formProps} />
            </div>
            <DemoOpportunityCard className="hidden lg:block" />
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">{copy.howTitle}</h2>
          <p className="mt-3 max-w-2xl text-base font-medium text-muted-foreground sm:text-lg">
            {copy.howLead}
          </p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {copy.howSteps.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground tabular-nums">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-foreground leading-snug">{step.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-wide text-secondary">
              {copy.proTitle}
            </p>
            <p className="mt-2 max-w-2xl text-base font-medium text-muted-foreground">{copy.proLead}</p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {copy.differentiators.map((item) => (
                <li key={item.num}>
                  <p className="text-xs font-extrabold tabular-nums text-primary/50">{item.num}</p>
                  <h3 className="mt-2 text-base font-extrabold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm font-medium leading-6 text-muted-foreground">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
            <a
              href="#waitlist"
              onClick={() =>
                track('waitlist_cta_click', { placement: 'value_band', variant: VARIANT })
              }
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary px-5 text-sm font-extrabold text-secondary-foreground transition hover:brightness-105"
            >
              {copy.proCta}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="text-center text-2xl font-extrabold text-primary sm:text-3xl">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card">
            {copy.faq.map((item) => (
              <details key={item.q} className="group px-5 py-4 sm:px-6">
                <summary className="cursor-pointer list-none text-base font-extrabold text-foreground marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-xl font-extrabold text-secondary transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">
                  {item.a}
                  {item.q.includes('בטוחים') ? (
                    <>
                      {' '}
                      <Link href="/privacy" className="font-bold text-primary underline">
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

      <footer className="border-t border-border bg-card px-5 py-8 text-center text-sm font-medium text-muted-foreground">
        <p className="font-extrabold text-primary" dir="ltr">
          Fixly<span className="text-secondary">.</span>
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
              <a
                href={PRODUCT_URL}
                className="underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
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
            className="flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-secondary px-5 text-base font-extrabold text-secondary-foreground shadow-[0_12px_32px_rgba(245,158,11,0.35)]"
          >
            {copy.stickyCta}
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </a>
        </div>
      ) : null}
    </div>
  )
}

function DemoOpportunityCard({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-[var(--radius-lg)] border border-dashed border-primary/25 bg-card p-4 ${className}`}
      aria-label={copy.previewTitle}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-primary">{copy.previewTitle}</p>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary">
          {copy.previewBadge}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wrench className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-foreground">{copy.previewJobTitle}</p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{copy.previewJobMeta}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden />
            {copy.previewJobStatus}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-medium text-muted-foreground">{copy.previewLead}</p>
    </aside>
  )
}

type WaitlistFormProps = {
  form: FormState
  loading: boolean
  error: string | null
  done: boolean
  shareCopied: boolean
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
      className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 className="mb-1 text-center text-sm font-extrabold tracking-wide text-primary">
        {copy.formEyebrow}
      </h2>
      <p className="mb-5 text-center text-xs font-semibold text-muted-foreground">
        {copy.proHint}
      </p>

      {done ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center sm:py-10">
          <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
          <p className="text-xl font-extrabold text-primary">{copy.successTitle}</p>
          <p className="max-w-sm text-sm font-medium text-muted-foreground">
            {copy.successPro}
          </p>
          <div className="mt-4 w-full max-w-sm rounded-xl border border-border bg-background p-4 text-start">
            <p className="text-sm font-extrabold text-primary">{copy.successShareTitle}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
              {copy.successShareLead}
            </p>
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-extrabold text-white transition hover:brightness-105"
              >
                {copy.successShareWhatsApp}
              </a>
              <button
                type="button"
                onClick={() => onShare('native')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-extrabold text-primary transition hover:bg-primary/5"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {shareCopied ? copy.successShareCopied : copy.successShareNative}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetDone}
            className="mt-2 text-sm font-bold text-primary underline"
          >
            לרשום עוד מישהו
          </button>
        </div>
      ) : (
        <form className="mt-1 space-y-4" onSubmit={onSubmit} onFocus={onSignupStarted}>
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
            <p
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-base font-extrabold text-secondary-foreground transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {loading ? 'שולחים…' : copy.submitPro}
            {!loading ? <ArrowLeft className="h-4 w-4" aria-hidden /> : null}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
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
      <span className="mb-1.5 block text-sm font-bold text-primary">
        תחומי מקצוע
        <span className="mr-1 font-semibold text-muted-foreground">
          (חובה · עד {WAITLIST_MAX_PROFESSIONS})
        </span>
      </span>

      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onRemove(name)}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary"
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
        className="flex w-full min-h-[48px] items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-start text-base font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <span className={selected.length ? 'text-primary' : 'text-muted-foreground'}>
          {selected.length
            ? `${selected.length} תחומים נבחרו`
            : 'בחרו תחומים — למשל מזגנים, חשמל…'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="border-b border-border p-2">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש תחום…"
                className="w-full rounded-lg border border-border bg-background py-2.5 pe-3 ps-9 text-sm font-medium outline-none focus:border-primary"
              />
            </label>
          </div>
          <ul
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-y-auto overscroll-contain p-1.5"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm font-medium text-muted-foreground">
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
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-start text-sm font-bold transition ${
                        isOn
                          ? 'bg-primary/10 text-primary'
                          : disabled
                            ? 'cursor-not-allowed text-muted-foreground/40'
                            : 'text-foreground/80 hover:bg-background'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          isOn
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card'
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
            <p className="border-t border-border px-3 py-2 text-xs font-semibold text-warning-foreground">
              הגעתם למקסימום {WAITLIST_MAX_PROFESSIONS} תחומים
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
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
      <span className="mb-1.5 block text-sm font-bold text-primary">{label}</span>
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
        className="w-full min-h-[48px] rounded-xl border border-border bg-card px-3 py-2.5 text-base font-medium text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}
