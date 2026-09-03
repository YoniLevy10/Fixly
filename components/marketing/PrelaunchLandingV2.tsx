'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Home,
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

const categories = ['אינסטלטור', 'חשמלאי', 'מזגנים', 'הנדימן', 'ניקיון', 'שיפוצים']

const faqs = [
  {
    q: 'מה Fixly עושה בפועל?',
    a: 'במקום לחפש, להתקשר ולרדוף אחרי כמה בעלי מקצוע, שולחים בקשה אחת. Fixly מתאימה בעלי מקצוע לפי התחום והאזור ומאפשרת לעקוב אחרי ההתקדמות עד סיום.',
  },
  {
    q: 'זה עולה כסף ללקוחות?',
    a: 'ההרשמה המוקדמת והשימוש ללקוחות הם בחינם. אין צורך בכרטיס אשראי כדי להצטרף לרשימת ההשקה.',
  },
  {
    q: 'איך בעלי מקצוע מצטרפים?',
    a: 'בעלי מקצוע יכולים להירשם לפיילוט, לבחור תחום ועיר, ולקבל עדיפות בכניסה כשנפתח באזור שלהם.',
  },
  {
    q: 'באילו אזורים השירות יפעל?',
    a: 'אנחנו מתחילים בפיילוט ממוקד בישראל ומתרחבים לפי הביקוש שנאסף בהרשמה המוקדמת.',
  },
]

function forceHebrewRtl() {
  document.documentElement.lang = 'he'
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.classList.add('locale-rtl')
  document.documentElement.classList.remove('locale-ltr')
  document.body.dir = 'rtl'
}

export default function PrelaunchLandingV2() {
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
    track('waitlist_page_view', { path: window.location.pathname, variant: 'landing_v2' })

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
          track('waitlist_scroll_depth', { depth: mark, variant: 'landing_v2' })
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const markSignupStarted = () => {
    if (startedRef.current) return
    startedRef.current = true
    track('waitlist_signup_started', { audience, variant: 'landing_v2' })
  }

  const switchAudience = (next: WaitlistAudience) => {
    setAudience(next)
    setDone(false)
    setError(null)
    startedRef.current = false
    track('waitlist_audience_switch', { audience: next, variant: 'landing_v2' })
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

      track('waitlist_submitted', { audience, variant: 'landing_v2' })
      track('waitlist_signup_completed', { audience, variant: 'landing_v2' })
      setDone(true)
      setForm(emptyForm)
      startedRef.current = false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בשליחה'
      setError(message)
      track('waitlist_form_error', {
        audience,
        variant: 'landing_v2',
        message: message.slice(0, 80),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#f7f9fc] pb-24 text-[#10233f] md:pb-0"
      dir="rtl"
      lang="he"
    >
      <style jsx global>{`
        @keyframes fixly-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fixly-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(14px, -12px, 0) scale(1.04); }
        }
        @keyframes fixly-progress {
          from { width: 18%; }
          to { width: 86%; }
        }
        .fixly-float { animation: fixly-float 5.5s ease-in-out infinite; }
        .fixly-drift { animation: fixly-drift 9s ease-in-out infinite; }
        .fixly-progress { animation: fixly-progress 2.8s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) {
          .fixly-float, .fixly-drift, .fixly-progress { animation: none !important; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="fixly-drift absolute -right-32 -top-20 h-80 w-80 rounded-full bg-[#ffd98e]/55 blur-3xl" />
        <div className="fixly-drift absolute -left-40 top-[36rem] h-96 w-96 rounded-full bg-[#bfd6f0]/60 blur-3xl [animation-delay:1.5s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,53,99,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(18,53,99,0.035)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:linear-gradient(to_bottom,black,transparent_58%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-[#123563]/8 bg-[#f7f9fc]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#top" className="flex items-center gap-2" aria-label="Fixly דף הבית">
            <span dir="ltr" className="text-2xl font-black tracking-tight text-[#123563]">
              Fixly<span className="text-[#f59e0b]">.</span>
            </span>
            <span className="hidden rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200 sm:inline-flex">
              בקרוב בישראל
            </span>
          </a>

          <a
            href="#waitlist"
            onClick={() => track('waitlist_cta_click', { placement: 'header', variant: 'landing_v2' })}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#123563] px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c294f]"
          >
            הצטרפו בחינם
            <ArrowLeft className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main id="top">
        <section className="relative mx-auto grid min-h-[calc(100svh-68px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16 lg:py-16">
          <div
            className={`transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#123563]/10 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-[#123563] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#f59e0b]" />
              פחות חיפושים. פחות טלפונים. יותר ודאות.
            </div>

            <h1 className="max-w-3xl text-[clamp(2.6rem,8vw,5.6rem)] font-black leading-[0.98] tracking-[-0.045em] text-[#10233f]">
              יש תקלה בבית?
              <span className="mt-2 block text-[#123563]">שולחים פעם אחת.</span>
              <span className="mt-2 block text-[#f59e0b]">Fixly ממשיכה משם.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-xl sm:leading-9">
              מתארים מה צריך, מקבלים התאמות של בעלי מקצוע לפי תחום ואזור, ועוקבים אחרי העבודה עד שהיא נסגרת — במקום להתחיל עוד סבב חיפושים וטלפונים.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#waitlist"
                onClick={() => track('waitlist_cta_click', { placement: 'hero', variant: 'landing_v2' })}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#123563] px-7 text-base font-black text-white shadow-[0_14px_36px_rgba(18,53,99,0.22)] transition hover:-translate-y-1 hover:bg-[#0c294f]"
              >
                אני רוצה להיות ראשון/ה
                <ArrowLeft className="h-5 w-5" />
              </a>
              <a
                href="#how"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl px-6 text-base font-extrabold text-[#123563] transition hover:bg-white"
              >
                תראו לי איך זה עובד
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#123563]" />
                בלי כרטיס אשראי
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-[#123563]" />
                הרשמה בפחות מדקה
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#123563]" />
                גם ללקוחות וגם לבעלי מקצוע
              </span>
            </div>

            <div className="mt-8 flex max-w-2xl flex-wrap gap-2" aria-label="קטגוריות לדוגמה">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-[#123563]/10 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#40546e] shadow-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`relative transition-all delay-150 duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <HeroFlowMock />
          </div>
        </section>

        <section className="border-y border-[#123563]/8 bg-[#10233f] text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:grid-cols-3 sm:px-8">
            {[
              ['01', 'לא אינדקס', 'לא רשימה אינסופית של מספרי טלפון. מתחילים מהבקשה שלך.'],
              ['02', 'לא ניחושים', 'ההתאמה מתחילה בתחום ובאזור — לא ממי ששילם להיות ראשון ברשימה.'],
              ['03', 'לא נעלמים אחרי הליד', 'המטרה היא לעקוב אחרי הבקשה עד שהעבודה באמת נסגרת.'],
            ].map(([num, title, text]) => (
              <div key={num} className="flex gap-4">
                <span className="text-sm font-black text-[#f59e0b]">{num}</span>
                <div>
                  <h2 className="font-black">{title}</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-white/65">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f59e0b]">איך זה עובד</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#10233f] sm:text-5xl">
              מבקשה אחת — עד פתרון.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600 sm:text-lg">
              בנינו את הזרימה סביב מה שאנשים באמת שונאים בתיקונים בבית: החיפוש, ההמתנה וחוסר הוודאות.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <ProcessCard
              icon={<Home className="h-6 w-6" />}
              step="1"
              title="מספרים מה קרה"
              text="כותבים בקצרה מה צריך ובאיזה אזור. בקשה אחת במקום להסביר את אותה תקלה שוב ושוב."
            />
            <ProcessCard
              icon={<Search className="h-6 w-6" />}
              step="2"
              title="Fixly מחפשת התאמה"
              text="מקבלים בעלי מקצוע רלוונטיים לתחום ולאזור, עם תהליך מסודר ולא מרדף אקראי."
            />
            <ProcessCard
              icon={<Zap className="h-6 w-6" />}
              step="3"
              title="רואים מה קורה"
              text="הבקשה עוברת סטטוסים ברורים — מאישור ועד בדרך, בביצוע וסיום."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-24">
          <div className="grid overflow-hidden rounded-[2rem] border border-[#123563]/10 bg-white shadow-[0_28px_80px_rgba(18,53,99,0.10)] lg:grid-cols-2">
            <div className="p-7 sm:p-10 lg:p-12">
              <span className="inline-flex rounded-full bg-[#eef4fa] px-3 py-1 text-xs font-black text-[#123563]">ללקוחות</span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[#10233f]">לא צריך לדעת את מי להתקשר.</h2>
              <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                אתם צריכים שהבעיה תיפתר. Fixly נועדה להפוך את כל הדרך לבעל המקצוע למסלול אחד ברור.
              </p>
              <ul className="mt-6 space-y-3 text-sm font-bold text-[#40546e]">
                {['בקשה אחת', 'התאמה לפי צורך ואזור', 'מעקב אחרי סטטוס העבודה'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#10233f] p-7 text-white sm:p-10 lg:p-12">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#ffd07a]">לבעלי מקצוע</span>
              <h2 className="mt-5 text-3xl font-black tracking-tight">פחות לידים קרים. יותר בקשות רלוונטיות.</h2>
              <p className="mt-4 text-base font-medium leading-7 text-white/70">
                מצטרפים מוקדם לפיילוט, מגדירים תחום ואזור, ונכנסים ראשונים כשהביקוש נפתח באזור שלכם.
              </p>
              <a
                href="#waitlist"
                onClick={() => {
                  switchAudience('professional')
                  track('waitlist_cta_click', { placement: 'pro_panel', variant: 'landing_v2' })
                }}
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#f59e0b] px-5 text-sm font-black text-[#10233f] transition hover:-translate-y-0.5 hover:bg-[#f6ab24]"
              >
                אני בעל/ת מקצוע
                <ArrowLeft className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section id="waitlist" className="relative overflow-hidden bg-[#eaf1f8]">
          <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[#f59e0b]/20 blur-3xl" />
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f59e0b]">הרשמה מוקדמת</p>
              <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-[#10233f] sm:text-5xl">
                תיכנסו לפני שהדלת נפתחת לכולם.
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                אנחנו אוספים עכשיו את קבוצת ההשקה הראשונה של לקוחות ובעלי מקצוע. משאירים שם וטלפון — ומעדכנים כשנפתחת הגישה באזור שלכם.
              </p>

              <div className="mt-7 grid max-w-lg gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-[#123563]" />
                  <p className="mt-2 text-sm font-black">בלי התחייבות</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">אין חיוב ואין כרטיס אשראי בהרשמה.</p>
                </div>
                <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <Sparkles className="h-5 w-5 text-[#f59e0b]" />
                  <p className="mt-2 text-sm font-black">גישה מוקדמת</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">מי שנרשם עכשיו נכנס ראשון לפיילוט.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(18,53,99,0.13)] sm:p-7">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f3f6fa] p-1.5" role="tablist" aria-label="סוג הרשמה">
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === 'customer'}
                  onClick={() => switchAudience('customer')}
                  className={`min-h-11 rounded-xl px-3 text-sm font-black transition ${
                    audience === 'customer' ? 'bg-white text-[#123563] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  אני לקוח/ה
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === 'professional'}
                  onClick={() => switchAudience('professional')}
                  className={`min-h-11 rounded-xl px-3 text-sm font-black transition ${
                    audience === 'professional' ? 'bg-white text-[#123563] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  אני בעל/ת מקצוע
                </button>
              </div>

              {done ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#10233f]">אתם בפנים 🎉</h3>
                  <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
                    {audience === 'professional'
                      ? 'נעדכן אתכם עם פרטי ההצטרפות לבעלי מקצוע כשהפיילוט נפתח.'
                      : 'נעדכן אתכם ברגע ש-Fixly נפתחת באזור שלכם.'}
                  </p>
                </div>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={submit} onFocus={markSignupStarted}>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#10233f]">שם מלא</span>
                    <input
                      required
                      minLength={2}
                      value={form.fullName}
                      onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-slate-400 focus:border-[#123563] focus:ring-4 focus:ring-[#123563]/10"
                      placeholder="איך קוראים לך?"
                      autoComplete="name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#10233f]">טלפון</span>
                    <input
                      required
                      minLength={7}
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-left text-base font-medium outline-none transition placeholder:text-slate-400 focus:border-[#123563] focus:ring-4 focus:ring-[#123563]/10"
                      placeholder="050-0000000"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#10233f]">עיר <span className="font-medium text-slate-400">(אופציונלי)</span></span>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-slate-400 focus:border-[#123563] focus:ring-4 focus:ring-[#123563]/10"
                      placeholder="למשל ירושלים"
                      autoComplete="address-level2"
                    />
                  </label>

                  {audience === 'professional' ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-[#10233f]">תחום מקצוע</span>
                      <input
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-slate-400 focus:border-[#123563] focus:ring-4 focus:ring-[#123563]/10"
                        placeholder="למשל אינסטלציה"
                      />
                    </label>
                  ) : null}

                  {error ? (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#123563] px-5 text-base font-black text-white shadow-[0_12px_28px_rgba(18,53,99,0.20)] transition hover:-translate-y-0.5 hover:bg-[#0c294f] disabled:cursor-wait disabled:opacity-65"
                  >
                    {loading ? 'שומר את המקום...' : audience === 'professional' ? 'הצטרפו כבעלי מקצוע' : 'שמרו לי מקום'}
                    {!loading ? <ArrowLeft className="h-5 w-5" /> : null}
                  </button>

                  <p className="text-center text-xs font-medium leading-5 text-slate-400">
                    בשליחה אתם מבקשים מאיתנו לעדכן אתכם לגבי ההשקה. אפשר לבקש הסרה בכל עת.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f59e0b]">שאלות נפוצות</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#10233f] sm:text-4xl">לפני שנרשמים.</h2>
          </div>

          <div className="mt-10 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {faqs.map((item) => (
              <details key={item.q} className="group p-5 sm:p-6">
                <summary className="cursor-pointer list-none text-base font-black text-[#10233f] marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-xl font-black text-[#f59e0b] transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#123563]/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span dir="ltr" className="font-black text-[#123563]">Fixly<span className="text-[#f59e0b]">.</span></span>
          <p className="font-medium">נבנה בישראל כדי להפוך תיקונים בבית לפחות מתישים.</p>
        </div>
      </footer>

      <div className="fixed inset-x-3 bottom-3 z-50 md:hidden">
        <a
          href="#waitlist"
          onClick={() => track('waitlist_cta_click', { placement: 'mobile_sticky', variant: 'landing_v2' })}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#123563] px-5 text-base font-black text-white shadow-[0_18px_48px_rgba(18,53,99,0.34)]"
        >
          הצטרפו בחינם
          <ArrowLeft className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}

function ProcessCard({
  icon,
  step,
  title,
  text,
}: {
  icon: React.ReactNode
  step: string
  title: string
  text: string
}) {
  return (
    <article className="group rounded-[1.75rem] border border-[#123563]/10 bg-white p-6 shadow-[0_18px_50px_rgba(18,53,99,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(18,53,99,0.10)] sm:p-7">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123563] text-white transition group-hover:rotate-3 group-hover:scale-105">
          {icon}
        </div>
        <span className="text-sm font-black text-[#f59e0b]">{step}</span>
      </div>
      <h3 className="mt-6 text-xl font-black text-[#10233f]">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{text}</p>
    </article>
  )
}

function HeroFlowMock() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] py-8" aria-label="הדגמה של זרימת בקשה ב-Fixly">
      <div className="absolute inset-x-10 top-12 h-[78%] rounded-[3rem] bg-[#123563]/12 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_30px_90px_rgba(18,53,99,0.18)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-400">ככה זה ירגיש</p>
            <p dir="ltr" className="mt-1 text-xl font-black text-[#123563]">Fixly<span className="text-[#f59e0b]">.</span></p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">בקשה פעילה</span>
        </div>

        <div className="mt-5 rounded-2xl bg-[#f5f8fb] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400">הבקשה שלך</p>
              <h3 className="mt-1 text-lg font-black text-[#10233f]">המים בכיור לא יורדים</h3>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#123563] shadow-sm">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
            <MapPin className="h-4 w-4 text-[#f59e0b]" />
            ירושלים · אינסטלציה
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <StatusRow done title="הבקשה נשלחה" subtitle="קיבלנו את הפרטים" />
          <StatusRow done title="נמצאה התאמה" subtitle="בעל מקצוע רלוונטי באזור" />
          <StatusRow active title="בדרך אליך" subtitle="השלב הבא מופיע כאן בזמן אמת" />
        </div>

        <div className="mt-6 rounded-2xl border border-[#123563]/10 bg-[#10233f] p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <BadgeCheck className="h-5 w-5 text-[#ffd07a]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/55">התאמה לדוגמה</p>
                <p className="mt-0.5 text-sm font-black">בעל מקצוע מאומת</p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white/80">באזור שלך</span>
          </div>
        </div>
      </div>

      <div className="fixly-float absolute -right-2 top-0 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_18px_40px_rgba(18,53,99,0.14)] sm:-right-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff5df] text-[#f59e0b]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">פחות חיפוש</p>
            <p className="text-xs font-black text-[#10233f]">בקשה אחת</p>
          </div>
        </div>
      </div>

      <div className="fixly-float absolute -bottom-1 -left-2 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_18px_40px_rgba(18,53,99,0.14)] [animation-delay:1.2s] sm:-left-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">פחות אי-ודאות</p>
            <p className="text-xs font-black text-[#10233f]">סטטוס ברור</p>
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
    <div className="grid grid-cols-[30px_1fr] gap-3">
      <div className="relative flex justify-center">
        <div
          className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
            done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : active
                ? 'border-[#f59e0b] bg-[#fff7e8] text-[#f59e0b]'
                : 'border-slate-200 bg-white text-slate-300'
          }`}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
        </div>
      </div>
      <div className="pb-1">
        <p className="text-sm font-black text-[#10233f]">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
        {active ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#fff1cf]">
            <div className="fixly-progress h-full rounded-full bg-[#f59e0b]" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
