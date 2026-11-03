import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import SeoLandingTracker from '@/components/seo/SeoLandingTracker'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { SEO_CITIES, locationHubPath } from '@/lib/seo/marketplace-pages'
import { SITE_URL } from '@/lib/site-config'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'בעלי מקצוע לפי עיר בישראל',
  description:
    'מצאו בעלי מקצוע לפי עיר ברחבי ישראל — תל אביב, ירושלים, חיפה, ראשון לציון ועוד. Fixly מחברת לקוחות ובעלי מקצוע אמיתיים.',
  alternates: { canonical: `${SITE_URL}/locations` },
  openGraph: {
    title: 'בעלי מקצוע לפי עיר בישראל | Fixly',
    description: 'היררכיית ערים ארצית של Fixly — בחרו עיר ומצאו מקצוע רלוונטי.',
    url: `${SITE_URL}/locations`,
    locale: 'he_IL',
  },
}

export default function LocationsIndexPage() {
  const crumbs = [
    { name: 'Fixly', path: '/' },
    { name: 'ערים', path: '/locations' },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-8">
      <SeoLandingTracker pageType="locations_index" indexable />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <SeoBreadcrumbs items={crumbs} />

      <header className="space-y-2">
        <h1 className="text-3xl font-black">בעלי מקצוע לפי עיר בישראל</h1>
        <p className="text-muted-foreground leading-relaxed">
          Fixly היא מערכת ארצית — לא מוגבלת לעיר אחת. בחרו עיר כדי לראות מקצועות זמינים באזור.
        </p>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {SEO_CITIES.map((city) => (
          <li key={city.slug}>
            <Link
              href={locationHubPath(city.slug)}
              className="flex rounded-xl border border-border bg-card px-4 py-3 font-bold hover:border-primary/40"
            >
              בעלי מקצוע ב{city.nameHe}
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-sm">
        <Link href={routes.professionals} className="underline font-medium">
          חיפוש לפי מקצוע
        </Link>
        {' · '}
        <Link href="/for-professionals" className="underline font-medium">
          עבודות לבעלי מקצוע
        </Link>
      </p>
    </main>
  )
}
