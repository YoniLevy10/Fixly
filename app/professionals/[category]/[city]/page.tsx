import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CategoryCityLanding, {
  resolveCategoryCity,
} from '@/components/seo/CategoryCityLanding'
import { listRealProfessionalsForSeo } from '@/lib/data/professionals-service'
import { resolveSeoIndexValue } from '@/lib/seo/has-seo-value'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { SITE_URL } from '@/lib/site-config'

type PageProps = {
  params: Promise<{ category: string; city: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  return SEO_CATEGORIES.flatMap((category) =>
    SEO_CITIES.map((city) => ({
      category: category.slug,
      city: city.slug,
    })),
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug, city: citySlug } = await params
  const { category, city } = resolveCategoryCity(categorySlug, citySlug)
  if (!category || !city) notFound()

  const seo = await resolveSeoIndexValue({
    cityQuery: city.query,
    categorySlug: category.slug,
  })
  const path = seoPagePath(category.slug, city.slug)
  const title = `${category.nameHe} ב${city.nameHe}`
  const description = seo.hasValue
    ? `מצא ${category.nameHe} ב${city.nameHe}. בקשה מהירה, התאמה לפי אזור ומעקב עד סיום — Fixly ישראל.`
    : `${category.nameHe} ב${city.nameHe} — Fixly נפתחת לפי צפיפות אמיתית. הירשמו לעדכון באזור.`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    robots: seo.hasValue
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${title} | Fixly`,
      description,
      url: `${SITE_URL}${path}`,
      locale: 'he_IL',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${title} | Fixly`,
      description,
    },
  }
}

export default async function ProfessionalsCategoryCityPage({ params }: PageProps) {
  const { category: categorySlug, city: citySlug } = await params
  const { category, city } = resolveCategoryCity(categorySlug, citySlug)
  if (!category || !city) notFound()

  const seo = await resolveSeoIndexValue({
    cityQuery: city.query,
    categorySlug: category.slug,
  })
  const pros =
    seo.realProCount > 0
      ? await listRealProfessionalsForSeo({
          categorySlug: category.slug,
          query: city.query,
        })
      : []

  return (
    <CategoryCityLanding city={city} category={category} seo={seo} pros={pros} />
  )
}
