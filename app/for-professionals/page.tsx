import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import SeoLandingTracker from '@/components/seo/SeoLandingTracker'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/json-ld'
import { SEO_CATEGORIES, categoryHubPath } from '@/lib/seo/marketplace-pages'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/site-config'

const FAQS = [
  {
    question: 'יש עבודות לבעלי מקצוע ב-Fixly?',
    answer:
      'Fixly בונה מאגר ארצי של בעלי מקצוע ומחברת ביקוש אמיתי לפי תחום ואזור. אנחנו לא מבטיחים כמות לידים או עבודות — ההצטרפות היא כדי להיות במאגר כשיש התאמה.',
  },
  {
    question: 'כמה עולה להצטרף? יש עמלה או מנוי?',
    answer:
      'ההצטרפות חינם, ללא מנוי, ללא עמלה וללא התחייבות. אם בעתיד יתווספו מסלולי לידים בתשלום — זה יוצג בשקיפות לפני כל חיוב.',
  },
  {
    question: 'האם זה רק בירושלים?',
    answer:
      'לא. Fixly מכוונת לכל ישראל. נרשמים עם אזור השירות שלכם — תל אביב, חיפה, באר שבע, השרון ועוד.',
  },
  {
    question: 'למי זה מתאים?',
    answer:
      'לאינסטלטורים, חשמלאים, הנדימנים, טכנאי מיזוג, צבעים, נגרים ובעלי מקצוע תחזוקה נוספים שמחפשים עבודות ולידים איכותיים לפי אזור.',
  },
]

export const metadata: Metadata = {
  title: 'עבודות לבעלי מקצוע בישראל | ללא עמלה',
  description:
    'עבודות ולידים לבעלי מקצוע בישראל דרך Fixly. הצטרפות חינם — ללא מנוי, ללא עמלה וללא התחייבות. מאגר ארצי לאינסטלטורים, חשמלאים, הנדימנים ועוד.',
  keywords: [
    'עבודות לבעלי מקצוע',
    'לידים לבעלי מקצוע',
    'עבודות לחשמלאים',
    'עבודות לאינסטלטורים',
    'עבודות להנדימנים',
    'עבודות תחזוקה',
    'עבודות לבעלי מקצוע ללא עמלה',
  ],
  alternates: { canonical: `${SITE_URL}/for-professionals` },
  openGraph: {
    title: 'עבודות לבעלי מקצוע בישראל | Fixly',
    description:
      'הצטרפו למאגר הארצי של Fixly בחינם — ללא מנוי וללא עמלה. לא מבטיחים כמות לידים.',
    url: `${SITE_URL}/for-professionals`,
    locale: 'he_IL',
  },
}

export default function ForProfessionalsPage() {
  const crumbs = [
    { name: 'Fixly', path: '/' },
    { name: 'לבעלי מקצוע', path: '/for-professionals' },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-28 space-y-8">
      <SeoLandingTracker pageType="for_professionals" indexable />
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqJsonLd(FAQS)]} />
      <SeoBreadcrumbs items={crumbs} />

      <header className="space-y-3">
        <h1 className="text-3xl font-black leading-tight">
          עבודות לבעלי מקצוע בישראל
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Fixly בונה מאגר ארצי של בעלי מקצוע לתחזוקה ותיקונים.
          מחפשים לידים או עבודות לפי תחום ואזור? ההצטרפות{' '}
          <strong className="text-foreground">חינם · ללא מנוי · ללא עמלה · ללא התחייבות</strong>.
        </p>
      </header>

      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
        <p className="text-sm font-medium leading-relaxed">
          אנחנו לא מבטיחים מספר לידים או עבודות. אנחנו כן מבטיחים שקיפות:
          נרשמים למאגר, ומקבלים פניות כשיש התאמה אמיתית לתחום ולאזור שלכם.
        </p>
        <Link
          href={`${routes.waitlist}?audience=professional&utm_source=fixly&utm_medium=organic&utm_campaign=for_professionals`}
          data-seo-cta="professional_signup"
          className="block text-center bg-primary text-white py-3.5 rounded-xl font-bold"
        >
          הצטרפו בחינם ל-Fixly
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">למי זה רלוונטי?</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SEO_CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={categoryHubPath(c.slug)}
                className="flex rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold hover:border-primary/40"
              >
                {c.jobsHe}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">איך זה עובד?</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>נרשמים עם שם, טלפון ותחום</li>
          <li>מציינים אזורי שירות ברחבי הארץ</li>
          <li>כשיש בקשה מתאימה — מקבלים פנייה</li>
          <li>אתם מחליטים אם לקבל את העבודה</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">שאלות נפוצות</h2>
        <dl className="space-y-3">
          {FAQS.map((f) => (
            <div key={f.question} className="rounded-xl border border-border bg-card p-4">
              <dt className="font-bold text-sm">{f.question}</dt>
              <dd className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
