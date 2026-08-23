'use client'

import Link from 'next/link'
import { CheckCircle2, ShieldCheck, Star, Wrench, Zap } from 'lucide-react'
import MetaPixel from './MetaPixel'

type Variant = 'customer' | 'professional'

const copy = {
  customer: {
    eyebrow: 'שירות חדש בירושלים',
    title: 'בעל מקצוע טוב, בלי להתחיל לרדוף אחרי אנשים',
    subtitle: 'מתארים מה צריך לתקן, Fixly מאתרת בעלי מקצוע מתאימים ועוזרת לכם לעקוב עד שהעבודה מסתיימת.',
    cta: 'מצאו לי בעל מקצוע',
    href: '/request?utm_source=meta&utm_medium=paid_social&utm_campaign=jerusalem_customers_v1',
    note: 'הבקשה ללא עלות וללא התחייבות',
    bullets: ['בקשה אחת במקום עשרות טלפונים', 'בעלי מקצוע רלוונטיים לפי סוג התקלה', 'מעקב מסודר עד לסיום העבודה'],
    cardTitle: 'יש תקלה בבית?',
    cardText: 'אינסטלציה, חשמל, מיזוג, תיקונים ועוד',
  },
  professional: {
    eyebrow: 'לבעלי מקצוע בירושלים',
    title: 'פחות זמן לחפש עבודה. יותר עבודות שמתאימות לכם',
    subtitle: 'Fixly מחברת אתכם ללקוחות שכבר צריכים את השירות שלכם — לפי תחום, אזור וזמינות.',
    cta: 'הצטרפו כבעלי מקצוע',
    href: '/pro/join?utm_source=meta&utm_medium=paid_social&utm_campaign=jerusalem_pros_v1',
    note: '3 לידים ראשונים בחודש ללא עלות',
    bullets: ['פניות ממוקדות באזור העבודה שלכם', 'ניהול לידים ועבודות במקום אחד', 'פרופיל מקצועי שבונה אמון'],
    cardTitle: 'העבודה הבאה כבר מחכה',
    cardText: 'הצטרפות מוקדמת לפיילוט ירושלים',
  },
} as const

export default function CampaignLanding({ variant }: { variant: Variant }) {
  const c = copy[variant]
  const trackLead = () => {
    window.fbq?.('track', 'Lead', { content_name: variant })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fb] text-[#0f2342]" dir="rtl">
      <MetaPixel />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-2xl font-black tracking-tight">Fixly<span className="text-orange-500">.</span></Link>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><ShieldCheck className="h-4 w-4 text-emerald-600" /> פיילוט ירושלים</div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.08fr_.92fr] lg:pt-20">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-800">{c.eyebrow}</div>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">{c.subtitle}</p>

          <ul className="mt-8 space-y-4">
            {c.bullets.map((item) => (
              <li key={item} className="flex items-center gap-3 font-bold text-slate-700">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> {item}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col items-start gap-3">
            <Link href={c.href} onClick={trackLead} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#123563] px-7 text-lg font-black text-white shadow-[0_12px_30px_rgba(18,53,99,.22)] transition hover:-translate-y-0.5 hover:bg-[#0c294f] focus:outline-none focus:ring-4 focus:ring-blue-200">
              {c.cta} <Zap className="h-5 w-5 fill-orange-400 text-orange-400" />
            </Link>
            <span className="text-sm font-semibold text-slate-500">{c.note}</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 -z-0 rounded-full bg-gradient-to-br from-blue-200/60 to-orange-100/60 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,35,66,.14)] sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><Wrench className="h-7 w-7" /></div>
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-700"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9</div>
            </div>
            <h2 className="text-2xl font-black">{c.cardTitle}</h2>
            <p className="mt-2 font-medium text-slate-500">{c.cardText}</p>
            <div className="mt-8 space-y-3">
              {['ספרו לנו מה צריך', 'מקבלים התאמות רלוונטיות', 'עוקבים עד שהכול סגור'].map((step, i) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#123563] font-black text-white">{i + 1}</span>
                  <span className="font-extrabold text-slate-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-sm font-medium text-slate-500">
        © Fixly · שירות התאמה וניהול בקשות · <Link href="/privacy" className="underline">פרטיות</Link>
      </footer>
    </main>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}
