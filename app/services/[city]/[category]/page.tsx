// Note: Hebrew strings in metadata and UI here are intentional.
// These are SEO landing pages targeting Hebrew-speaking Israeli users.
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  getCategoryBySlug,
  getCityBySlug,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { listRealProfessionalsForSeo } from '@/lib/data/professionals-service'
import { resolveSeoIndexValue } from '@/lib/seo/has-seo-value'
import {
  buildBreadcrumbListSchema,
  buildProfessionalsItemListSchema,
} from '@/lib/seo/schema'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/site-config'
import ProListCard from '@/components/professionals/ProListCard'
import FixlyGuaranteeBanner from '@/components/shared/FixlyGuaranteeBanner'
import JsonLd from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import ServicesSeoFooter from '@/components/seo/ServicesSeoFooter'

type PageProps = {
  params: Promise<{ city: string; category: string }>
}

export async function generateStaticParams() {
  return SEO_CITIES.flatMap((city) =>
    SEO_CATEGORIES.map((cat) => ({
      city: city.slug,
      category: cat.slug,
    })),
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, category } = await params
  const cityMeta = getCityBySlug(city)
  const catMeta = getCategoryBySlug(category)
  if (!cityMeta || !catMeta) return { title: 'Fixly' }

  const seo = await resolveSeoIndexValue({
    cityQuery: cityMeta.query,
    categorySlug: category,
  })
  const canonicalPath = seoPagePath(city, category)
  const canonical = `${SITE_URL}${canonicalPath}`
  const title = `${catMeta.nameHe} ב${cityMeta.nameHe} | Fixly`
  const description = seo.hasValue
    ? `מצא ${catMeta.nameHe} מומלץ ב${cityMeta.nameHe}. בקשה מהירה ומעקב עד סיום — Fixly.`
    : `${catMeta.nameHe} ב${cityMeta.nameHe} — Fixly נפתחת לפי צפיפות. הירשמו לעדכון.`

  return {
    title,
    description,
    alternates: { canonical },
    robots: seo.hasValue
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${catMeta.nameHe} ב${cityMeta.nameHe}`,
      description: seo.hasValue
        ? `אנשי מקצוע אמיתיים ב${cityMeta.nameHe}`
        : `הרשמה ל-${catMeta.nameHe} ב${cityMeta.nameHe}`,
      url: canonical,
      locale: 'he_IL',
      type: 'website',
    },
  }
}

export default async function ServiceLandingPage({ params }: PageProps) {
  const { city, category } = await params
  const cityMeta = getCityBySlug(city)
  const catMeta = getCategoryBySlug(category)

  if (!cityMeta || !catMeta) {
    return <article className="p-6">Not found</article>
  }

  const seo = await resolveSeoIndexValue({
    cityQuery: cityMeta.query,
    categorySlug: category,
  })
  const pros =
    seo.realProCount > 0
      ? await listRealProfessionalsForSeo({
          categorySlug: category,
          query: cityMeta.query,
        })
      : []

  const path = seoPagePath(city, category)
  const listPros = pros.slice(0, 12)
  const breadcrumbItems = [
    { name: 'Fixly', href: routes.home },
    { name: 'קטגוריות', href: '/categories' },
    { name: cityMeta.nameHe, href: `/categories#${city}` },
    { name: catMeta.nameHe },
  ]
  const breadcrumbLd = buildBreadcrumbListSchema([
    { name: 'Fixly', path: routes.home },
    { name: 'קטגוריות', path: '/categories' },
    { name: `${catMeta.nameHe} ב${cityMeta.nameHe}`, path },
  ])
  const itemListLd =
    listPros.length > 0
      ? buildProfessionalsItemListSchema(listPros, {
          name: `${catMeta.nameHe} ב${cityMeta.nameHe}`,
          description: `אנשי מקצוע ב-${catMeta.nameHe} באזור ${cityMeta.nameHe}`,
        })
      : null

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 pb-28 space-y-6">
      <JsonLd data={breadcrumbLd} />
      {itemListLd ? <JsonLd data={itemListLd} /> : null}

      <SeoBreadcrumbs items={breadcrumbItems} />

      <header>
        <p className="text-sm text-muted-foreground">Fixly</p>
        <h1 className="text-3xl font-black">
          {catMeta.nameHe} ב{cityMeta.nameHe}
        </h1>
        <p className="text-muted-foreground mt-2">
          {pros.length > 0
            ? `${pros.length} אנשי מקצוע זמינים • בקשה חינם • מעקב חי`
            : seo.reason === 'waitlist_demand'
              ? `ביקוש מאומת באזור — נפתח כשיש אספקה. בינתיים אפשר להירשם.`
              : 'נפתח לפי צפיפות אמיתית באזור — בלי פרופילי דמו'}
        </p>
      </header>

      {pros.length > 0 ? (
        <section aria-labelledby="pros-heading" className="space-y-3">
          <h2 id="pros-heading" className="text-xl font-bold">
            אנשי מקצוע מומלצים ב{cityMeta.nameHe}
          </h2>
          <FixlyGuaranteeBanner compact />
          <div className="space-y-3">
            {listPros.map((pro) => (
              <ProListCard key={pro.id} professional={pro} />
            ))}
          </div>
          <h2 className="text-lg font-bold pt-2">שלחו בקשה עכשיו</h2>
          <Link
            href={routes.newRequest}
            className="block text-center bg-primary text-white py-3 rounded-xl font-bold"
          >
            שלח בקשה עכשיו
          </Link>
        </section>
      ) : (
        <section
          aria-labelledby="waitlist-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-4"
        >
          <h2 id="waitlist-heading" className="text-lg font-bold">
            נפתח בקרוב ב{cityMeta.nameHe}
          </h2>
          <p className="text-muted-foreground">
            עדיין אין בעלי מקצוע אמיתיים מאומתים ב{cityMeta.nameHe} לתחום הזה.
            אנחנו לא מציגים פרופילי דמו בדפי חיפוש.
          </p>
          <Link
            href={`${routes.waitlist}?audience=customer&utm_source=fixly&utm_medium=organic&utm_campaign=services_${city}_${category}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
          >
            הירשמו לעדכון כשלקוחות נפתחים באזור
          </Link>
          <p className="text-xs text-muted-foreground">
            בעל/ת מקצוע?{' '}
            <Link
              href={`${routes.waitlist}?audience=professional&utm_source=fixly&utm_medium=organic&utm_campaign=services_pro_${city}`}
              className="font-bold text-primary underline"
            >
              הצטרפו לרשימה
            </Link>
          </p>
        </section>
      )}

      <ServicesSeoFooter currentPath={path} />
    </article>
  )
}
