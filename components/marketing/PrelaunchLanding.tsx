'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  Search,
  Share2,
  Wrench,
  X,
} from 'lucide-react'
import EntryNotice from '@/components/marketing/EntryNotice'
import {
  getStoredAttribution,
  getStoredReferral,
} from '@/components/shared/ReferralCapture'
import { track } from '@/lib/analytics/track'
import { publicAttribution } from '@/lib/marketing/utm'
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
const VARIANT = 'landing_v8'

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
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
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
    // Hide sticky as soon as any part of the form panel approaches the viewport
    // so it never covers inputs / submit on short phones.
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!(entry?.isIntersecting ?? false)),
      { rootMargin: '0px 0px -18% 0px', threshold: [0, 0.05, 0.15] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const markSignupStarted = () => {
    if (startedRef.current) return
    startedRef.current = true
    track('waitlist_signup_started', {
      audience,
      variant: VARIANT,
      ...publicAttribution(getStoredAttribution()),
    })
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
      track('waitlist_form_error', {
        audience,
        variant: VARIANT,
        reason: 'missing_profession',
        stage: 'client_validation',
      })
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
          source: 'waitlist_landing_v8_professional',
          ...(referralCode ? { referralCode } : {}),
          ...(Object.keys(attribution).length > 0 ? { attribution } : {}),
        }),
      })
      const data = (await res.json().catch(() => null)) as
        | {
            error?: string
            code?: string
            id?: string
            ok?: boolean
            alreadyRegistered?: boolean
          }
        | null
      if (!res.ok) {
        const errorCode = data?.code
        track('waitlist_form_error', {
          audience,
          variant: VARIANT,
          reason: 'submit_failed',
          stage: 'api',
          status: res.status,
          error_code: errorCode ?? 'unknown',
        })
        if (res.status === 429) {
          setError('יותר מדי ניסיונות — נסו שוב בעוד דקה')
        } else if (res.status === 403 && errorCode === 'GEO_BLOCKED') {
          setError('השירות זמין בישראל בלבד')
        } else if (res.status >= 500) {
          setError('שגיאה זמנית בשמירה — נסו שוב')
        } else {
          setError(data?.error || 'לא הצלחנו לשמור את הפרטים')
        }
        return
      }
      if (!data?.id || !isUuid(data.id)) {
        track('waitlist_form_error', {
          audience,
          variant: VARIANT,
          reason: 'missing_id',
          stage: 'response_contract',
          status: res.status,
        })
        setError('השמירה לא אושרה — נסו שוב')
        return
      }
      const source = publicAttribution(attribution)
      if (!data.alreadyRegistered) {
        track('waitlist_signup_completed', {
          audience,
          variant: VARIANT,
          ...source,
        })
      }
      setAlreadyRegistered(Boolean(data.alreadyRegistered))
      setDone(true)
      setForm(emptyForm)
      startedRef.current = false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בשליחה'
      setError(message)
      track('waitlist_form_error', {
        audience,
        variant: VARIANT,
        reason: 'submit_failed',
        stage: 'api',
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
    alreadyRegistered,
    shareCopied,
    onFormChange: setForm,
    onSubmit: submit,
    onSignupStarted: markSignupStarted,
    onShare: shareWaitlist,
    onResetDone: () => {
      setDone(false)
      setAlreadyRegistered(false)
      setShareCopied(false)
    },
  }

  return (
    <div
      className={`prelaunch-root prelaunch-paper min-h-screen overflow-x-hidden text-foreground md:pb-0 ${
        showSticky ? 'has-sticky-cta' : 'pb-6'
      }`}
      dir="rtl"
      lang="he"
    >
      <EntryNotice />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-[color-mix(in_srgb,hsl(var(--background))_92%,transparent)] backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div
          className="mx-auto flex items-center justify-between py-3"
          style={{ maxWidth: 'var(--prelaunch-max)', paddingInline: 'var(--prelaunch-gutter)' }}
        >
          <a href="#top" className="prelaunch-brand text-[1.25rem] font-extrabold text-primary sm:text-[1.35rem]" aria-label="Fixly" dir="ltr">
            {copy.brand}
            <span className="text-secondary">.</span>
          </a>
          {/* Mobile: compact header CTA; desktop keeps full label */}
          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'header', variant: VARIANT })}
            className="prelaunch-cta prelaunch-cta-primary inline-flex !min-h-10 px-3.5 text-sm sm:px-4"
          >
            <span className="sm:hidden">הצטרפות</span>
            <span className="hidden sm:inline">{copy.primaryCta}</span>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </header>

      <main id="top">
        {/* One composition: brand · headline · sub · CTA · product visual */}
        <section
          className="prelaunch-hero mx-auto grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,26rem)] lg:gap-14"
          style={{
            maxWidth: 'var(--prelaunch-max)',
            paddingInline: 'var(--prelaunch-gutter)',
            paddingBlock: 'clamp(2rem, 6vw, 4.5rem) clamp(2.5rem, 5vw, 3.5rem)',
          }}
        >
          <div className={`prelaunch-hero-copy order-2 lg:order-1 ${mounted ? 'prelaunch-rise' : 'opacity-0'}`}>
            <p
              dir="ltr"
              className="prelaunch-brand prelaunch-hero-brand mb-5 text-[clamp(2.75rem,9vw,4.5rem)] font-extrabold leading-none text-primary"
            >
              {copy.brand}
              <span className="text-secondary">.</span>
            </p>

            <h1 className="prelaunch-hero-title max-w-[18ch] text-[clamp(1.85rem,6.2vw,3.15rem)] font-extrabold leading-[1.12] text-foreground">
              <span className="block">{copy.headline}</span>
              <span className="mt-1 block text-primary sm:mt-1.5">{copy.headlineLine2}</span>
            </h1>

            <p className="prelaunch-hero-sub mt-5 max-w-md text-[1.05rem] font-medium leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {copy.subheadline}
            </p>
            <p className="mt-3 max-w-md text-sm font-bold leading-6 text-foreground">
              {copy.expectation}
            </p>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-muted-foreground">
              מחפשים בעל מקצוע?{' '}
              <Link href="/professionals" className="font-bold text-primary underline underline-offset-2">
                בחרו מקצוע ועיר
              </Link>
            </p>

            {/* Mobile: text link only (header + form submit carry primary CTA). Desktop: both. */}
            <div className="prelaunch-hero-actions mt-8">
              <a href="#how" className="prelaunch-link sm:hidden">
                {copy.secondaryCta}
              </a>
              <div className="hidden flex-wrap items-center gap-3 sm:flex">
                <a
                  href="#waitlist"
                  onClick={() =>
                    track('waitlist_cta_click', { placement: 'hero_primary', variant: VARIANT })
                  }
                  className="prelaunch-cta prelaunch-cta-primary inline-flex text-base"
                >
                  {copy.primaryCta}
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </a>
                <a
                  href="#how"
                  className="prelaunch-cta prelaunch-cta-secondary inline-flex text-base"
                >
                  {copy.secondaryCta}
                </a>
              </div>
            </div>
          </div>

          <div
            id="waitlist"
            ref={waitlistRef}
            className={`order-1 scroll-mt-24 lg:order-2 ${mounted ? 'prelaunch-rise prelaunch-rise-delay' : 'opacity-0'}`}
          >
            <div className="prelaunch-product overflow-hidden">
              <div className="prelaunch-product-head border-b border-border/80 bg-background/60 px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      {copy.formEyebrow}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{copy.formLead}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    {copy.proHint}
                  </span>
                </div>
              </div>
              <div className="prelaunch-product-body px-5 py-5 sm:px-6 sm:py-6">
                <WaitlistFormCard {...formProps} />
              </div>
              <div className="hidden sm:block">
                <DemoOpportunityCard />
              </div>
            </div>
            {/* Demo below the form on phones so the form stays the hero visual */}
            <div className="mt-3 sm:hidden">
              <div className="prelaunch-product overflow-hidden">
                <DemoOpportunityCard standalone />
              </div>
            </div>
          </div>
        </section>

        <div className="border-y border-border/80">
          <ul
            className="prelaunch-trust mx-auto justify-start text-sm font-semibold text-muted-foreground sm:flex-wrap sm:justify-center sm:overflow-visible sm:whitespace-normal"
            style={{ maxWidth: 'var(--prelaunch-max)' }}
          >
            {copy.trustItems.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-secondary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <section
          id="how"
          className="mx-auto"
          style={{
            maxWidth: 'var(--prelaunch-max)',
            paddingInline: 'var(--prelaunch-gutter)',
            paddingBlock: 'clamp(3.5rem, 8vw, 6rem)',
          }}
        >
          <h2 className="text-[clamp(1.65rem,3.5vw,2.25rem)] font-extrabold text-foreground">
            {copy.howTitle}
          </h2>
          <p className="mt-3 max-w-xl text-base font-medium text-muted-foreground sm:text-lg">
            {copy.howLead}
          </p>
          <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {copy.howSteps.map((step, i) => (
              <li key={step.title} className="relative">
                <p className="text-[0.7rem] font-extrabold tabular-nums tracking-[0.18em] text-secondary">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-lg font-extrabold leading-snug text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mx-auto"
          style={{
            maxWidth: 'var(--prelaunch-max)',
            paddingInline: 'var(--prelaunch-gutter)',
            paddingBottom: 'clamp(3.5rem, 8vw, 5.5rem)',
          }}
        >
          <div className="overflow-hidden rounded-[1.25rem] border border-border bg-primary px-7 py-9 text-primary-foreground sm:px-10 sm:py-12">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-secondary">
              {copy.proTitle}
            </p>
            <p className="mt-3 max-w-xl text-base font-medium text-primary-foreground/80">
              {copy.proLead}
            </p>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {copy.differentiators.map((item) => (
                <li key={item.num}>
                  <p className="text-[0.7rem] font-extrabold tabular-nums tracking-[0.16em] text-secondary/90">
                    {item.num}
                  </p>
                  <h3 className="mt-2 text-base font-extrabold text-primary-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium leading-6 text-primary-foreground/70">
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
              className="prelaunch-cta prelaunch-cta-primary inline-flex mt-10 text-sm"
            >
              {copy.proCta}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </section>

        <section
          className="mx-auto"
          style={{
            maxWidth: '40rem',
            paddingInline: 'var(--prelaunch-gutter)',
            paddingBottom: 'clamp(3.5rem, 8vw, 5.5rem)',
          }}
        >
          <h2 className="text-center text-[clamp(1.65rem,3.5vw,2.1rem)] font-extrabold text-foreground">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 divide-y divide-border overflow-hidden rounded-[1.15rem] border border-border bg-card">
            {copy.faq.map((item) => (
              <details key={item.q} className="group px-5 py-4 sm:px-6">
                <summary className="cursor-pointer list-none text-[0.98rem] font-extrabold text-foreground marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-base font-extrabold text-secondary transition group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 pe-10 text-sm font-medium leading-7 text-muted-foreground">
                  {item.a}
                  {item.q.includes('בטוחים') ? (
                    <>
                      {' '}
                      <Link href="/privacy" className="font-bold text-primary underline underline-offset-2">
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

      <footer className="border-t border-border bg-card/60 px-5 py-10 text-center text-sm font-medium text-muted-foreground">
        <p className="prelaunch-brand text-lg font-extrabold text-primary" dir="ltr">
          Fixly<span className="text-secondary">.</span>
        </p>
        <p className="mt-3">
          © {new Date().getFullYear()} Fixly ·{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            פרטיות
          </Link>
          {' · '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
            תנאים
          </Link>
          {' · '}
          <Link href="/about" className="underline underline-offset-2 hover:text-foreground">
            אודות
          </Link>
          {' · '}
          <Link href="/waitlist" className="underline underline-offset-2 hover:text-foreground">
            הרשמה
          </Link>
          {' · '}
          <Link href="/for-professionals" className="underline underline-offset-2 hover:text-foreground">
            לבעלי מקצוע
          </Link>
          {' · '}
          <Link href="/professionals" className="underline underline-offset-2 hover:text-foreground">
            חיפוש בעל מקצוע
          </Link>
          {PRODUCT_URL ? (
            <>
              {' · '}
              <a
                href={PRODUCT_URL}
                className="underline underline-offset-2 hover:text-foreground"
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
        <div className="prelaunch-sticky fixed z-50 md:hidden">
          <a
            href="#waitlist"
            onClick={() =>
              track('waitlist_cta_click', { placement: 'mobile_sticky', variant: VARIANT })
            }
            className="prelaunch-cta prelaunch-cta-primary inline-flex w-full min-h-14 text-base shadow-[0_16px_40px_-8px_rgba(245,158,11,0.55)]"
          >
            {copy.stickyCta}
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </a>
        </div>
      ) : null}
    </div>
  )
}

function DemoOpportunityCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <aside
      className={`${standalone ? 'bg-card' : 'border-t border-border/80 bg-background/50'} px-4 py-3.5 sm:px-6 sm:py-4`}
      aria-label={copy.previewTitle}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          {copy.previewTitle}
        </p>
        <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-primary-foreground">
          {copy.previewBadge}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10">
          <Wrench className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
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
  alreadyRegistered: boolean
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
  alreadyRegistered,
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

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center sm:py-8">
        <CheckCircle2 className="h-11 w-11 text-success" aria-hidden />
        <p className="text-xl font-extrabold text-primary">{copy.successTitle}</p>
        <p className="max-w-sm text-sm font-medium text-muted-foreground">
          {alreadyRegistered ? copy.successAlready : copy.successPro}
        </p>
        <div className="mt-3 w-full rounded-xl border border-border bg-background p-4 text-start">
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
          className="mt-1 text-sm font-bold text-primary underline underline-offset-2"
        >
          לרשום עוד מישהו
        </button>
      </div>
    )
  }

  return (
    <form className="space-y-3.5 sm:space-y-4" onSubmit={onSubmit} onFocus={onSignupStarted} id="waitlist-panel">
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
      {error ? (
        <p
          className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="prelaunch-cta prelaunch-cta-primary inline-flex w-full text-base disabled:opacity-60"
      >
        {loading ? 'שולחים…' : copy.submitPro}
        {!loading ? <ArrowLeft className="h-4 w-4" aria-hidden /> : null}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        בלי כרטיס אשראי · אפשר להסיר בכל עת
      </p>
    </form>
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
    ? WAITLIST_PROFESSION_OPTIONS.filter((name) => name.includes(query.trim()))
    : WAITLIST_PROFESSION_OPTIONS

  const atLimit = selected.length >= WAITLIST_MAX_PROFESSIONS

  return (
    <div ref={rootRef} className="block">
      <span className="mb-1.5 block text-[0.8rem] font-bold text-foreground">
        תחומי מקצוע
        <span className="mr-1 font-medium text-muted-foreground">
          (חובה · עד {WAITLIST_MAX_PROFESSIONS})
        </span>
      </span>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {copy.categories.map((category) => {
          const selectedChip = selected.includes(category.profession)
          return (
            <button
              key={category.profession}
              type="button"
              aria-pressed={selectedChip}
              onClick={() => onToggle(category.profession)}
              className={`inline-flex min-h-11 items-center rounded-lg border px-2.5 text-xs font-bold transition ${
                selectedChip
                  ? 'border-primary bg-primary/8 text-primary'
                  : 'border-border bg-card text-foreground/80 hover:border-primary/40'
              }`}
            >
              {category.label}
            </button>
          )
        })}
      </div>

      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onRemove(name)}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-primary/8 px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-primary/10"
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
        className="prelaunch-input flex items-center justify-between gap-2 text-start"
      >
        <span className={selected.length ? 'text-foreground' : 'text-muted-foreground'}>
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
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_40px_-20px_rgba(18,53,99,0.35)]">
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
                          ? 'bg-primary/8 text-primary'
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
            <p className="border-t border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              הגעתם למקסימום {WAITLIST_MAX_PROFESSIONS} תחומים
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
        אפשר לבחור כמה תחומים.
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
      <span className="mb-1.5 block text-[0.8rem] font-bold text-foreground">{label}</span>
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
        className="prelaunch-input"
      />
    </label>
  )
}
