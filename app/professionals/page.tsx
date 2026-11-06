import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import ProfessionalsScreen from '@/components/professionals/ProfessionalsScreen'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  categoryHubPath,
  locationHubPath,
} from '@/lib/seo/marketplace-pages'
import { routes } from '@/lib/routes'
import { isMarketingHost, requestHostFromHeaders } from '@/lib/site-hosts'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'מצאו בעלי מקצוע בישראל',
  description:
    'חיפוש בעלי מקצוע לפי מקצוע ועיר ברחבי ישראל — אינסטלטור, חשמלאי, הנדימן ועוד. בקשה אחת ומעקב עד סיום ב-Fixly.',
  alternates: { canonical: `${SITE_URL}/professionals` },
  openGraph: {
    title: 'מצאו בעלי מקצוע בישראל | Fixly',
    description: 'חיפוש ארצי לפי מקצוע ועיר — בלי פרופילי דמו בדפי SEO.',
    url: `${SITE_URL}/professionals`,
    locale: 'he_IL',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

function ProfessionalsDirectory() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-black">מצאו בעל מקצוע בישראל</h1>
        <p className="text-muted-foreground leading-relaxed">
          הדף הזה מיועד למי שמחפש אינסטלטור, חשמלאי או בעל מקצוע אחר.
          מוצגים רק דפים שיש בהם בעל מקצוע אמיתי או ביקוש מאומת.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-lg font-black">בעל מקצוע שמחפש עבודות?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ההרשמה למאגר נפרדת מחיפוש בעל מקצוע. היא חינם, בלי מנוי ובלי עמלה, ולא מבטיחה כמות לידים.
        </p>
        <Link
          href={`${routes.waitlist}?audience=professional&utm_source=fixly&utm_medium=organic&utm_campaign=professionals_directory#waitlist`}
          className="inline-flex min-h-11 items-center font-bold text-primary underline"
        >
          הצטרפות לבעלי מקצוע
        </Link>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-black mb-2">לפי מקצוע</h2>
          <ul className="flex flex-wrap gap-2">
            {SEO_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={categoryHubPath(c.slug)}
                  className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium hover:border-primary/40"
                >
                  {c.nameHe}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-black mb-2">לפי עיר</h2>
          <ul className="flex flex-wrap gap-2">
            {SEO_CITIES.slice(0, 12).map((c) => (
              <li key={c.slug}>
                <Link
                  href={locationHubPath(c.slug)}
                  className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium hover:border-primary/40"
                >
                  {c.nameHe}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/locations"
                className="inline-flex rounded-full border border-dashed px-3 py-1.5 text-xs font-medium"
              >
                כל הערים
              </Link>
            </li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          בעל מקצוע?{' '}
          <Link href="/for-professionals" className="font-bold text-primary underline">
            עבודות לבעלי מקצוע — הצטרפות חינם
          </Link>
        </p>
      </section>
    </main>
  )
}

export default async function ProfessionalsPage() {
  const host = requestHostFromHeaders(await headers())
  if (isMarketingHost(host)) return <ProfessionalsDirectory />

  return (
    <>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        }
      >
        <ProfessionalsScreen />
      </Suspense>
      <ProfessionalsDirectory />
    </>
  )
}
