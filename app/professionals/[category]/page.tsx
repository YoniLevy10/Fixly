import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import SeoLandingTracker from '@/components/seo/SeoLandingTracker'
import { categoryHubFaqs } from '@/lib/seo/faq'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/json-ld'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  categoryHubPath,
  getCategoryBySlug,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { categoryHasAnyProfessional, resolveSeoIndexValue } from '@/lib/seo/has-seo-value'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/site-config'

type PageProps = {
  params: Promise<{ category: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  return SEO_CATEGORIES.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) notFound()
  const path = categoryHubPath(category.slug)
  const title = `${category.nameHe} בישראל`
  const description = `מצא ${category.nameHe} בערים ברחבי ישראל דרך Fixly. בקשה אחת, התאמה לפי אזור, ומעקב עד סיום.`
  const indexable = await categoryHasAnyProfessional(category.slug)
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

export default async function ProfessionalsCategoryHubPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const cityValues = await Promise.all(
    SEO_CITIES.map(async (city) => {
      const seo = await resolveSeoIndexValue({
        cityQuery: city.query,
        categorySlug: category.slug,
      })
      return { city, seo }
    }),
  )
  const indexable = cityValues.filter((c) => c.seo.hasValue)
  const pending = cityValues.filter((c) => !c.seo.hasValue)
  const faqs = categoryHubFaqs(category)
  const crumbs = [
    { name: 'Fixly', path: '/' },
    { name: 'בעלי מקצוע', path: routes.professionals },
    { name: category.nameHe, path: categoryHubPath(category.slug) },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-8">
      <SeoLandingTracker pageType="category_hub" category={category.slug} indexable />
      <JsonLd data={[breadcrumbJsonLd(crumbs), faqJsonLd(faqs)]} />
      <SeoBreadcrumbs items={crumbs} />

      <header className="space-y-2">
        <h1 className="text-3xl font-black">{category.nameHe} בישראל</h1>
        <p className="text-muted-foreground leading-relaxed">
          בחרו עיר כדי למצוא {category.nameHe} באזור שלכם. Fixly היא מערכת ארצית —
          מוצגים רק בעלי מקצוע אמיתיים, בלי פרופילי דמו.
        </p>
      </header>

      <p>
        <Link
          href={`${routes.waitlist}?audience=professional&utm_source=fixly&utm_medium=organic&utm_campaign=hub_${category.slug}`}
          data-seo-cta="waitlist_pro"
          className="text-sm font-bold text-primary underline"
        >
          {category.jobsHe} — הצטרפו בחינם, ללא מנוי וללא עמלה
        </Link>
      </p>

      {indexable.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">ערים פעילות ל{category.nameHe}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {indexable.map(({ city, seo }) => (
              <li key={city.slug}>
                <Link
                  href={seoPagePath(category.slug, city.slug)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40"
                >
                  <span className="font-bold">
                    {category.nameHe} ב{city.nameHe}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {seo.realProCount > 0 ? `${seo.realProCount} פרופילים` : 'ביקוש מאומת'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">ערים נוספות בדרך</h2>
        <p className="text-sm text-muted-foreground">
          העמודים קיימים במערכת ויהפכו לאינדקס אוטומטית כשיהיה ערך אמיתי (בעל מקצוע או ביקוש מאומת).
        </p>
        <ul className="flex flex-wrap gap-2">
          {pending.map(({ city }) => (
            <li
              key={city.slug}
              className="inline-flex rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              {city.nameHe}
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

      <p className="text-sm">
        <Link href="/locations" className="underline font-medium">
          כל הערים ב-Fixly
        </Link>
        {' · '}
        <Link href={routes.professionals} className="underline font-medium">
          חיפוש בעלי מקצוע
        </Link>
      </p>
    </main>
  )
}
