// Hebrew copy intentional — SEO hub for Israeli marketplace landing pages.
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { SITE_URL } from '@/lib/site-config'
import { routes } from '@/lib/routes'
import JsonLd from '@/components/seo/JsonLd'
import { buildCategoriesCollectionSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'קטגוריות שירותים לפי עיר',
  description:
    'כל דפי השירותים של Fixly — אינסטלטור, חשמלאי, מיזוג ועוד בערים מובילות בישראל.',
  alternates: { canonical: `${SITE_URL}/categories` },
  openGraph: {
    title: 'קטגוריות שירותים לפי עיר | Fixly',
    description:
      'דפי כוונה לפי עיר וקטגוריה — מצאו בעל מקצוע או הירשמו לעדכון באזור שלכם.',
    url: `${SITE_URL}/categories`,
    locale: 'he_IL',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function CategoriesPage() {
  const links = SEO_CITIES.flatMap((city) =>
    SEO_CATEGORIES.map((cat) => ({
      name: `${cat.nameHe} ב${city.nameHe}`,
      path: seoPagePath(city.slug, cat.slug),
      citySlug: city.slug,
      cityName: city.nameHe,
      categoryName: cat.nameHe,
    })),
  )

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-8">
      <JsonLd data={buildCategoriesCollectionSchema(links)} />

      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href={routes.home} className="hover:text-primary underline-offset-2 hover:underline">
            Fixly
          </Link>
          {' / '}
          קטגוריות
        </p>
        <h1 className="text-3xl font-black">שירותים לפי עיר וקטגוריה</h1>
        <p className="text-muted-foreground">
          {links.length} דפי כוונה — דפים בלי אספקה או ביקוש נשארים מחוץ לאינדקס
          (noindex) אבל נגישים מכאן.
        </p>
      </header>

      {SEO_CITIES.map((city) => (
        <section key={city.slug} id={city.slug} aria-labelledby={`city-${city.slug}`} className="space-y-3">
          <h2 id={`city-${city.slug}`} className="text-xl font-bold">
            {city.nameHe}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEO_CATEGORIES.map((cat) => {
              const path = seoPagePath(city.slug, cat.slug)
              return (
                <li key={path}>
                  <Link
                    href={path}
                    className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {cat.nameHe} ב{city.nameHe}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <p className="text-sm text-muted-foreground">
        מחפשים משהו אחר?{' '}
        <Link href={routes.professionals} className="text-primary font-medium underline-offset-2 hover:underline">
          חיפוש אנשי מקצוע
        </Link>
        {' · '}
        <Link href={routes.waitlist} className="text-primary font-medium underline-offset-2 hover:underline">
          הרשמה לרשימה
        </Link>
      </p>
    </article>
  )
}
