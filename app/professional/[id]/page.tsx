import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProfessionalProfileView from '@/components/professionals/ProfessionalProfileView'
import { JsonLd } from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import SeoLandingTracker from '@/components/seo/SeoLandingTracker'
import { getProfessional } from '@/lib/data/professionals-service'
import { isSeedDemoProfessionalId } from '@/lib/data/seed-professionals'
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/seo/json-ld'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  categoryHubPath,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/site-config'

type ProfessionalPageProps = {
  params: Promise<{ id: string }>
}

function guessCategorySlug(categoryLabel: string): string | undefined {
  const hay = categoryLabel.toLowerCase()
  return SEO_CATEGORIES.find(
    (c) =>
      hay.includes(c.slug) ||
      hay.includes(c.nameHe) ||
      hay.includes(c.nameEn.toLowerCase()),
  )?.slug
}

function guessCitySlug(location?: string): string | undefined {
  if (!location) return undefined
  return SEO_CITIES.find(
    (c) => location.includes(c.nameHe) || location.toLowerCase().includes(c.slug),
  )?.slug
}

export async function generateMetadata({
  params,
}: ProfessionalPageProps): Promise<Metadata> {
  const { id } = await params
  const pro = await getProfessional(id)
  if (!pro) return { title: 'בעל מקצוע' }

  const isDemo = isSeedDemoProfessionalId(pro.id)
  const title = `${pro.name} — ${pro.title ?? pro.category}`
  const description = [
    pro.name,
    pro.title ?? pro.category,
    pro.location ? `ב${pro.location}` : 'בישראל',
    '· Fixly',
  ].join(' ')

  return {
    title,
    description: pro.description?.slice(0, 160) || description,
    alternates: { canonical: `${SITE_URL}${routes.professional(pro.id)}` },
    robots: isDemo || !pro.isApproved
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description: pro.description?.slice(0, 160) || description,
      url: `${SITE_URL}${routes.professional(pro.id)}`,
      locale: 'he_IL',
      type: 'profile',
    },
  }
}

export default async function ProfessionalPage({ params }: ProfessionalPageProps) {
  const { id } = await params
  const pro = await getProfessional(id)

  if (!pro) {
    notFound()
  }

  const isDemo = isSeedDemoProfessionalId(pro.id)
  const categorySlug = guessCategorySlug(pro.category)
  const citySlug = guessCitySlug(pro.location)
  const crumbs = [
    { name: 'Fixly', path: '/' },
    { name: 'בעלי מקצוע', path: routes.professionals },
    ...(categorySlug
      ? [{ name: pro.category, path: categoryHubPath(categorySlug) }]
      : []),
    ...(categorySlug && citySlug
      ? [{ name: pro.location || citySlug, path: seoPagePath(categorySlug, citySlug) }]
      : []),
    { name: pro.name, path: routes.professional(pro.id) },
  ]

  const schema =
    !isDemo && pro.isApproved
      ? localBusinessJsonLd({
          name: pro.name,
          description: pro.description,
          path: routes.professional(pro.id),
          category: pro.category,
          city: pro.location,
          rating: pro.reviewCount > 0 ? pro.rating : undefined,
          reviewCount: pro.reviewCount > 0 ? pro.reviewCount : undefined,
          image: pro.avatarUrl,
        })
      : null

  return (
    <>
      <SeoLandingTracker
        pageType="pro_profile"
        category={categorySlug}
        city={citySlug}
        indexable={!isDemo && pro.isApproved}
      />
      {schema && <JsonLd data={[breadcrumbJsonLd(crumbs), schema]} />}
      {!schema && <JsonLd data={breadcrumbJsonLd(crumbs)} />}
      <div className="max-w-4xl mx-auto px-4 pt-4 lg:px-8">
        <SeoBreadcrumbs items={crumbs} />
      </div>
      <ProfessionalProfileView pro={pro} />
    </>
  )
}
