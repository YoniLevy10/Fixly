import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'

const TITLE = 'לידים לבעלי מקצוע | הרשמה מוקדמת | Fixly'
const DESCRIPTION =
  'בעלי מקצוע שמחפשים לקוחות יכולים להירשם לרשימת ההשקה של Fixly לפי תחום ואזור. ההרשמה בחינם. בשלב הזה עדיין לא נשלחות עבודות.'

const TRADES = [
  {
    title: 'אינסטלטורים',
    text: 'אם אתם מחפשים עבודות אינסטלציה לפי אזור, ההרשמה שומרת את התחום שלכם. כש-Fixly תיפתח, נעדכן אתכם. לא נשלחת בקשה בשלב הזה.',
  },
  {
    title: 'חשמלאים',
    text: 'חשמלאים נרשמים עם תחום העבודה והעיר. הרשימה מיועדת לעדכון על הפתיחה, לא לקבלת לידים מיידית.',
  },
  {
    title: 'טכנאי מזגנים',
    text: 'אפשר לבחור מיזוג יחד עם תחומים נוספים. ההרשמה נשארת לבעלי מקצוע, בלי עלות ובלי כרטיס אשראי.',
  },
  {
    title: 'שיפוצניקים ומובילים',
    text: 'שיפוצים, הובלות, גינון, נגרות, מנעולנות וניקיון נמצאים באותו טופס. בוחרים את מה שמתאים לעסק.',
  },
] as const

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    'לידים לבעלי מקצוע',
    'עבודות לאינסטלטור',
    'לקוחות לחשמלאי',
    'הרשמה לבעלי מקצוע',
    'Fixly',
  ],
  alternates: { canonical: `${SITE_URL}/for-professionals` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/for-professionals`,
    siteName: 'Fixly',
    locale: 'he_IL',
    type: 'website',
  },
}

export default function ForProfessionalsPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'האם ההרשמה שולחת עבודות עכשיו?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'לא. זו רשימת השקה לבעלי מקצוע. נעדכן כש-Fixly תיפתח באזור ובתחום שנבחרו.',
        },
      },
      {
        '@type': 'Question',
        name: 'למי ההרשמה מיועדת?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'לבעלי ובעלות מקצוע בישראל שמחפשים לקוחות בהמשך. לקוחות שמחפשים בעל מקצוע לא נרשמים בדף הזה.',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#f5f2ea] px-5 py-12 text-[#10233f] sm:px-8" dir="rtl" lang="he">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-black tracking-[0.14em] text-[#a46520]">Fixly לבעלי מקצוע</p>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
          לבעלי מקצוע שמחפשים לקוחות
        </h1>
        <p className="mt-5 text-lg font-medium leading-8 text-[#526376]">{DESCRIPTION}</p>
        <Link
          href="/waitlist#waitlist-panel"
          className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#e9a638] px-6 text-base font-black text-[#10233f]"
        >
          להרשמה לרשימת ההשקה
        </Link>
        <div className="mt-12 grid gap-4">
          {TRADES.map((trade) => (
            <section key={trade.title} className="rounded-2xl border border-[#e6dfd2] bg-[#fffefa] p-5">
              <h2 className="text-xl font-black">{trade.title}</h2>
              <p className="mt-2 text-sm font-medium leading-7 text-[#58697a]">{trade.text}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm font-medium leading-7 text-[#58697a]">
          מחפשים בעל מקצוע לבית? האתר הזה כרגע פתוח להרשמת בעלי מקצוע בלבד.
        </p>
      </article>
    </main>
  )
}
