'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
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
  const [showSticky, setShowSticky] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const startedRef = useRef(false)
  const scrollMarks = useRef(new Set<number>())
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const waitlistRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    forceHebrewRtl()
    track('waitlist_page_view', { path: window.location.pathname, variant: VARIANT })

    const observer = new MutationObserver(() => {
      if (document.documentElement.getAttribute('dir') !== 'rtl') forceHebrewRtl()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir', 'lang'],
    })

    return () => observer.disconnect()
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
    const hero = heroSectionRef.current
    const form = waitlistRef.current
    if (!hero || !form) return
    if (typeof IntersectionObserver === 'undefined') {
      setShowSticky(true)
      return
    }

    let isHeroVisible = true
    let isFormVisible = false
    const updateVisibility = () => setShowSticky(!isHeroVisible && !isFormVisible)
    const heroObserver = new IntersectionObserver(([entry]) => {
      isHeroVisible = entry?.isIntersecting ?? false
      updateVisibility()
    })
    const formObserver = new IntersectionObserver(([entry]) => {
      isFormVisible = entry?.isIntersecting ?? false
      updateVisibility()
    }, { rootMargin: '-10% 0px -35% 0px', threshold: 0.05 })

    heroObserver.observe(hero)
    formObserver.observe(form)
    return () => {
      heroObserver.disconnect()
      formObserver.disconnect()
    }
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
          source: 'waitlist_landing_v6_professional',
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

  return (
    <div
      className="prelaunch-root min-h-screen overflow-x-clip bg-[#f5f2ea] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-[#10233f] md:pb-0"
      dir="rtl"
      lang="he"
    >
      <header className="sticky top-0 z-40 border-b border-[#10233f]/10 bg-[#f7f5ee]/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <a href="#top" className="flex min-h-11 items-center gap-2.5" aria-label="Fixly לבעלי מקצוע">
            <span dir="ltr" className="text-[1.7rem] font-black leading-none tracking-[-0.06em] text-[#10233f]">
              {copy.brand}<span className="text-[#e49a2f]">.</span>
            </span>
            <span className="rounded-full bg-[#e8e1d2] px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-[#40546a]">
              PRO
            </span>
          </a>
          <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 md:flex">
            <a href="#how" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#516173] transition hover:bg-white hover:text-[#10233f]">
              איך זה עובד
            </a>
            <a href="#professions" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#516173] transition hover:bg-white hover:text-[#10233f]">
              תחומים
            </a>
            <a href="#faq" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#516173] transition hover:bg-white hover:text-[#10233f]">
              שאלות נפוצות
            </a>
          </nav>
          <a
            href="#waitlist-panel"
            onClick={() => track('waitlist_cta_click', { placement: 'header', variant: VARIANT })}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#10233f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#1b3b57]"
          >
            {copy.primaryCta}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </header>

      <main id="top">
        <section ref={heroSectionRef} className="relative overflow-hidden bg-[#f5f2ea]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-[#efc56f]/20 blur-3xl" />
            <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#16354f]/[0.06] blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-7xl items-center gap-5 px-5 pb-7 pt-7 sm:gap-8 sm:px-8 sm:pb-14 sm:pt-12 lg:min-h-[640px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-16">
            <div className="relative z-10">
              <p className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#d7c8a8] bg-[#efe7d6] px-3.5 py-1.5 text-xs font-extrabold text-[#704b17] sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-[#3e8b70] shadow-[0_0_0_4px_rgba(62,139,112,0.12)]" aria-hidden="true" />
                {copy.badge}
              </p>
              <h1 className="mt-4 max-w-2xl text-[clamp(2.65rem,10vw,5.25rem)] font-black leading-[1.02] tracking-[-0.055em] text-[#10233f] sm:mt-6">
                {copy.headline}
                <br />
                <span className="text-[#bd741e]">{copy.headlineLine2}</span>
              </h1>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#526376] sm:mt-6 sm:text-lg sm:leading-8">
                {copy.subheadline}
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
                <a
                  href="#waitlist-panel"
                  onClick={() => track('waitlist_cta_click', { placement: 'hero', variant: VARIANT })}
                  className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#e9a638] px-6 text-base font-black text-[#10233f] shadow-[0_12px_24px_rgba(179,117,29,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f0b54e]"
                >
                  {copy.primaryCta}
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </a>
                <a
                  href="#how"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-extrabold text-[#40546a] underline decoration-[#bd741e]/50 underline-offset-4 transition hover:text-[#10233f]"
                >
                  {copy.secondaryCta}
                </a>
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-bold text-[#536477] sm:mt-7 sm:gap-x-5 sm:text-sm">
                {copy.trustItems.map((item, i) => {
                  const Icon = [MapPin, CheckCircle2, ShieldCheck][i] ?? CheckCircle2
                  return (
                    <li key={item} className="inline-flex items-center gap-1.5">
                      <Icon className="h-4 w-4 shrink-0 text-[#3e8069]" aria-hidden="true" />
                      {item}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="relative min-w-0">
              <div className="relative aspect-[1.45] overflow-hidden rounded-[1.75rem] bg-[#dfd2bf] shadow-[0_28px_65px_rgba(16,35,63,0.16)] sm:aspect-[1.55] lg:aspect-[0.93] lg:rounded-[2rem]">
                <Image
                  src="/brand/professional-hero.png"
                  alt="בעלת מקצוע מתקינה גוף תאורה בבית מואר"
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  className="object-cover object-center"
                />
                <div className="absolute right-3 top-3 sm:right-5 sm:top-5">
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/95 px-3.5 text-xs font-black text-[#40546a] shadow-lg backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-[#a46520]" aria-hidden="true" />
                    דוגמה להמחשה
                  </span>
                </div>
                <div className="absolute inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-5">
                  <div className="max-w-md rounded-[1.25rem] border border-white/80 bg-[#fffefa]/95 p-3.5 text-[#10233f] shadow-[0_18px_45px_rgba(16,35,63,0.24)] backdrop-blur-xl sm:p-4">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9a638]/25 text-[#10233f]">
                          <Zap className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black tracking-[0.1em] text-[#a46520]">בקשת שירות</p>
                          <p className="mt-0.5 truncate text-sm font-black sm:text-base">התקנת גוף תאורה</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#e7f0e9] px-2.5 py-1.5 text-[10px] font-black text-[#2f6a53] sm:text-xs">
                        מתאימה לתחום
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 border-t border-[#e8e2d8] pt-3 text-xs font-bold text-[#58697a]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#a46520]" aria-hidden="true" />
                      אזור העבודה שלכם · מועד גמיש
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-black">
                      <span className="rounded-lg bg-[#e9a638]/20 px-1.5 py-2 text-[#705019]">בקשה</span>
                      <span className="rounded-lg bg-[#e9a638]/20 px-1.5 py-2 text-[#705019]">התאמה</span>
                      <span className="rounded-lg bg-[#10233f] px-1.5 py-2 text-white">אתם מחליטים</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-2 hidden items-center gap-2 rounded-full border border-[#e8e1d2] bg-white px-4 py-2.5 text-xs font-extrabold text-[#40546a] shadow-lg lg:flex">
                <ShieldCheck className="h-4 w-4 text-[#3e8069]" aria-hidden="true" />
                הבחירה נשארת אצלכם
              </div>
            </div>
          </div>
        </section>

        <section
          id="waitlist"
          className="scroll-mt-16 relative overflow-hidden bg-[#102b43] px-5 py-12 text-white sm:px-8 sm:py-16 lg:py-20"
        >
          <div className="pointer-events-none absolute -left-32 -top-28 h-80 w-80 rounded-full bg-[#e9a638]/10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)] lg:gap-16">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.14em] text-[#f1c46b]">
                <span className="h-px w-6 bg-[#f1c46b]" aria-hidden="true" />
                הצטרפות לרשימת ההשקה
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl lg:text-[2.75rem]">
                {copy.proTitle}
              </h2>
              <p className="mt-4 max-w-lg text-base font-medium leading-7 text-white/75 sm:text-lg sm:leading-8">
                {copy.proLead}
              </p>
              <ul className="mt-7 grid gap-3 text-sm font-bold text-white/90 sm:text-base">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#f1c46b]" aria-hidden="true" />
                  הצטרפות ללא עלות וללא התחייבות
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-[#f1c46b]" aria-hidden="true" />
                  עדכון כש-Fixly תיפתח באזור שלכם
                </li>
                <li className="flex items-center gap-3">
                  <Lock className="h-5 w-5 shrink-0 text-[#f1c46b]" aria-hidden="true" />
                  הפרטים משמשים לניהול ההרשמה ולעדכונים
                </li>
              </ul>
            </div>
            <div id="waitlist-panel" ref={waitlistRef} className="scroll-mt-20">
              <WaitlistFormCard {...formProps} />
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-[#f5f2ea] px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-black tracking-[0.14em] text-[#a46520]">הגישה של Fixly</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-[#10233f] sm:text-4xl">
                {copy.howTitle}
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-[#58697a] sm:text-lg sm:leading-8">
                {copy.howLead}
              </p>
            </div>
            <ol className="mt-9 grid gap-4 sm:mt-11 sm:grid-cols-3 sm:gap-5">
              {copy.howSteps.map((step, i) => {
                const Icon = [Home, Search, Zap][i] ?? Home
                return (
                  <li key={step.title} className="rounded-[1.5rem] border border-[#e6dfd2] bg-[#fffefa] p-5 shadow-[0_8px_24px_rgba(16,35,63,0.04)] sm:p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-[0.15em] text-[#a46520]">0{i + 1}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9a638]/20 text-[#10233f]">
                        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-black text-[#10233f] sm:text-xl">{step.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#58697a] sm:text-base sm:leading-7">{step.text}</p>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        <section id="professions" className="scroll-mt-20 border-y border-[#10233f]/[0.06] bg-white px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div>
              <p className="text-xs font-black tracking-[0.14em] text-[#a46520]">לכל מי שבונה, מתקן ומחדש</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-[#10233f] sm:text-4xl">
                {copy.categoriesLabel}
              </h2>
              <p className="mt-4 max-w-lg text-base font-medium leading-7 text-[#58697a] sm:text-lg sm:leading-8">
                בין אם אתם עובדים לבד או מנהלים צוות, בחרו את התחומים שמתאימים לעסק שלכם.
              </p>
              <a
                href="#waitlist-panel"
                onClick={() => track('waitlist_cta_click', { placement: 'professions', variant: VARIANT })}
                className="mt-6 inline-flex min-h-12 items-center gap-2 font-black text-[#10233f] underline decoration-[#e9a638] decoration-2 underline-offset-4"
              >
                {copy.primaryCta}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {copy.categories.map((category) => (
                <li key={category.label} className="flex min-h-[88px] flex-col justify-center rounded-2xl border border-[#e7e4dd] bg-[#faf9f5] px-4 py-4 transition hover:border-[#d9bc7a] hover:bg-[#fffdf7]">
                  <span className="text-sm font-black text-[#10233f] sm:text-base">{category.label}</span>
                  <span className="mt-1 text-xs font-semibold text-[#718092]">{category.profession}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-[#f5f2ea] px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
            <div>
              <p className="text-xs font-black tracking-[0.14em] text-[#a46520]">לפני שמצטרפים</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-[#10233f] sm:text-4xl">{copy.faqTitle}</h2>
              <p className="mt-4 text-base font-medium leading-7 text-[#58697a]">
                כל מה שחשוב לדעת על ההרשמה ועל פתיחת Fixly.
              </p>
            </div>
            <div className="divide-y divide-[#e9e3d8] overflow-hidden rounded-[1.5rem] border border-[#e9e3d8] bg-[#fffefa]">
              {copy.faq.map((item) => (
                <details key={item.q} className="group px-5 sm:px-6">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-start text-sm font-black text-[#10233f] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c1842c] sm:text-base [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#a46520] transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-5 text-sm font-medium leading-7 text-[#58697a] sm:text-base">
                    {item.a}
                    {item.q.includes('בטוחים') ? (
                      <>
                        {' '}
                        <Link href="/privacy" className="font-bold text-[#10233f] underline underline-offset-2">
                          מדיניות הפרטיות
                        </Link>
                        .
                      </>
                    ) : null}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#102b43] px-5 py-12 text-white sm:px-8 sm:py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-black tracking-[0.14em] text-[#f1c46b]">FIXLY PRO</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">{copy.finalCtaTitle}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-white/75 sm:text-base">{copy.finalCtaLead}</p>
            </div>
            <a
              href="#waitlist-panel"
              onClick={() => track('waitlist_cta_click', { placement: 'final', variant: VARIANT })}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e9a638] px-6 text-base font-black text-[#10233f] transition hover:bg-[#f0b54e] sm:w-auto"
            >
              {copy.primaryCta}
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#10233f]/10 bg-[#f7f5ee] px-5 py-8 text-center text-sm font-medium text-[#687587]">
        <p className="font-black text-[#10233f]" dir="ltr">
          Fixly<span className="text-[#e49a2f]">.</span>
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
            href="#waitlist-panel"
            onClick={() =>
              track('waitlist_cta_click', { placement: 'mobile_sticky', variant: VARIANT })
            }
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#e9a638] px-5 text-base font-black text-[#10233f] shadow-[0_16px_40px_rgba(16,35,63,0.25)] transition hover:bg-[#f0b54e]"
          >
            {copy.stickyCta}
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
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
    <div className="rounded-[1.75rem] border border-white/80 bg-[#fffefa] p-4 text-[#10233f] shadow-[0_24px_70px_rgba(3,17,31,0.24)] sm:p-7">
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black tracking-[0.08em] text-[#a46520]">
            {copy.formEyebrow}
          </p>
          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#f5f2ea] px-2.5 text-[11px] font-bold text-[#58697a]">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            פחות מדקה
          </span>
        </div>
        <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-[#10233f]">
          {copy.waitlistTitle}
        </h3>
        <p className="mt-2 text-sm font-medium leading-6 text-[#58697a]">
          {copy.waitlistLead}
        </p>
        <p className="mt-2 text-xs font-bold text-[#718092]">{copy.proHint}</p>
      </div>

      {done ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center sm:py-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3f0e9] text-[#32775e]">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h3 className="text-xl font-black text-[#10233f]">{copy.successTitle}</h3>
          <p className="max-w-sm text-sm font-medium leading-6 text-[#58697a]">
            {copy.successPro}
          </p>
          <div className="mt-4 w-full max-w-sm rounded-2xl bg-[#f5f2ea] p-4 text-start">
            <p className="text-sm font-black text-[#10233f]">{copy.successShareTitle}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#718092]">{copy.successShareLead}</p>
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#218b5b] px-4 text-sm font-black text-white transition hover:bg-[#18764c]"
              >
                {copy.successShareWhatsApp}
              </a>
              <button
                type="button"
                onClick={() => onShare('native')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#10233f]/15 bg-white px-4 text-sm font-black text-[#10233f] transition hover:bg-[#faf9f5]"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {shareCopied ? copy.successShareCopied : copy.successShareNative}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetDone}
            className="mt-2 inline-flex min-h-11 items-center px-3 text-sm font-bold text-[#10233f] underline underline-offset-2"
          >
            לרשום עוד מישהו
          </button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={onSubmit} onFocus={onSignupStarted}>
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
            label="טלפון נייד"
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
            <p className="rounded-xl bg-[#fff0ed] px-3 py-2.5 text-sm font-semibold leading-6 text-[#a23d30]" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e9a638] px-6 text-base font-black text-[#10233f] transition hover:bg-[#f0b54e] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'שולחים…' : copy.submitPro}
            {!loading ? <ArrowLeft className="h-5 w-5" aria-hidden="true" /> : null}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium leading-5 text-[#718092]">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            בלי כרטיס אשראי · אפשר לבקש להסיר בכל עת
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
      <span className="mb-1.5 block text-sm font-extrabold text-[#10233f]">
        תחומי מקצוע
        <span className="mr-1 font-semibold text-[#718092]">(חובה · עד {WAITLIST_MAX_PROFESSIONS})</span>
      </span>

      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onRemove(name)}
              className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-xl bg-[#e9a638]/20 px-3 py-2 text-xs font-extrabold text-[#10233f] transition hover:bg-[#e9a638]/30"
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
        aria-controls="profession-options"
        aria-describedby="profession-help"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#d7dfe5] bg-[#faf9f5] px-3 text-start text-base font-semibold text-[#10233f] outline-none transition focus:border-[#a46520] focus:ring-4 focus:ring-[#e9a638]/20"
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
        <div className="mt-2 overflow-hidden rounded-2xl border border-[#dce2e6] bg-white shadow-[0_16px_40px_rgba(16,35,63,0.12)]">
          <div className="border-b border-[#edf0f1] p-2.5">
            <label className="relative block">
              <span className="sr-only">חיפוש תחום מקצוע</span>
              <Search
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8996]"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="חיפוש תחום מקצוע"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש תחום…"
                className="min-h-11 w-full rounded-xl border border-[#dce2e6] bg-[#faf9f5] pe-10 ps-3 text-base font-medium text-[#10233f] outline-none transition focus:border-[#a46520] focus:ring-2 focus:ring-[#e9a638]/20"
              />
            </label>
          </div>
          <div
            id="profession-options"
            role="group"
            aria-label="תחומי מקצוע"
            className="max-h-64 overflow-y-auto overscroll-contain p-1.5"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm font-medium text-[#718092]">
                לא נמצא תחום מתאים
              </p>
            ) : (
              filtered.map((name) => {
                const isOn = selected.includes(name)
                const disabled = !isOn && atLimit
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={isOn}
                    aria-disabled={disabled}
                    disabled={disabled}
                    onClick={() => onToggle(name)}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-start text-sm font-bold transition ${
                      isOn
                        ? 'bg-[#e9a638]/20 text-[#10233f]'
                        : disabled
                          ? 'cursor-not-allowed text-[#b7c0c8]'
                          : 'text-[#40546a] hover:bg-[#f5f2ea]'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        isOn
                          ? 'border-[#10233f] bg-[#10233f] text-white'
                          : 'border-[#c8d0d7] bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {isOn ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </span>
                    {name}
                  </button>
                )
              })
            )}
          </div>
          {atLimit ? (
            <p className="border-t border-[#edf0f1] px-3 py-2.5 text-xs font-semibold text-[#8a5e1c]">
              הגעתם למקסימום {WAITLIST_MAX_PROFESSIONS} תחומים
            </p>
          ) : null}
        </div>
      ) : null}

      <p id="profession-help" className="mt-1.5 text-xs font-medium leading-5 text-[#718092]">
        אפשר לבחור כמה תחומים — למשל מיזוג וגם חשמל.
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
      <span className="mb-1.5 block text-sm font-extrabold text-[#10233f]">{label}</span>
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
        className="min-h-11 w-full rounded-xl border border-[#d7dfe5] bg-[#faf9f5] px-3 text-base font-medium text-[#10233f] outline-none transition placeholder:text-[#94a0ab] focus:border-[#a46520] focus:bg-white focus:ring-4 focus:ring-[#e9a638]/20"
      />
    </label>
  )
}
