import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import SeoLandingTracker from '@/components/seo/SeoLandingTracker'
import { locationHubFaqs } from '@/lib/seo/faq'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/json-ld'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  getCityBySlug,
  locationHubPath,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { cityHasIndexablePair, resolveSeoIndexValue } from '@/lib/seo/has-seo-value'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/site-config'

type PageProps = {
  params: Promise<{ city: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  return SEO_CITIES.map((c) => ({ city: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()
  const path = locationHubPath(city.slug)
  const title = `בעלי מקצוע ב${city.nameHe}`
  const description = `בעלי מקצוע ב${city.nameHe} לפי תחום — אינסטלטור, חשמלאי, הנדימן ועוד. Fixly מציגה רק בעלי מקצוע אמיתיים.`
  const indexable = await cityHasIndexablePair(city.query)
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${title} | Fixly`,
      description,
      url: `${SITE_URL}${path}`,
      locale: 'he_IL',
    },
  }
}

export default async function LocationCityPage({ params }: PageProps) {
  const { city: slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()

  const catValues = await Promise.all(
    SEO_CATEGORIES.map(async (category) => {
      const seo = await resolveSeoIndexValue({
        cityQuery: city.query,
        categorySlug: category.slug,
      })
      return { category, seo }
    }),
  )
  const indexable = catValues.filter((c) => c.seo.hasValue)
  const pending = catValues.filter((c) => !c.seo.hasValue)
  const faqs = locationHubFaqs(city)
  const crumbs = [
    { name: 'Fixly', path: '/' },
    { name: 'ערים', path: '/locations' },
    { name: city.nameHe, path: locationHubPath(city.slug) },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-8">
      <SeoLandingTracker pageType="location_hub" city={city.slug} indexable />
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqJsonLd(faqs)]} />
      <SeoBreadcrumbs items={crumbs} />

      <header className="space-y-2">
        <h1 className="text-3xl font-black">בעלי מקצוע ב{city.nameHe}</h1>
        <p className="text-muted-foreground leading-relaxed">
          בחרו מקצוע כדי לראות פרופילים אמיתיים ב{city.nameHe}. Fixly לא מציגה דמו בדפי חיפוש.
        </p>
      </header>

      {indexable.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">מקצועות פעילים ב{city.nameHe}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {indexable.map(({ category, seo }) => (
              <li key={category.slug}>
                <Link
                  href={seoPagePath(category.slug, city.slug)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40"
                >
                  <span className="font-bold">{category.nameHe}</span>
                  <span className="text-xs text-muted-foreground">
                    {seo.realProCount > 0 ? `${seo.realProCount}` : 'ביקוש'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-center">
          <p className="text-muted-foreground text-sm">
            עדיין אין בעל מקצוע מאומת ב{city.nameHe}, ולכן אי אפשר להזמין מכאן עבודה.
          </p>
          <Link
            href={`${routes.forProfessionals}?utm_source=fixly&utm_medium=organic&utm_campaign=loc_pro_${city.slug}`}
            data-seo-cta="waitlist_pro"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
          >
            אני בעל מקצוע ב{city.nameHe} — הצטרפות
          </Link>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">מקצועות נוספים</h2>
        <ul className="flex flex-wrap gap-2">
          {pending.map(({ category }) => (
            <li
              key={category.slug}
              className="inline-flex rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              {category.nameHe}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">שאלות נפוצות</h2>
        <dl className="space-y-3">
          {faqs.map((f) => (
            <div key={f.question} className="rounded-xl border border-border bg-card p-4">
              <dt className="font-bold text-sm">{f.question}</dt>
              <dd className="text-sm text-muted-foreground mt-1.5">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
