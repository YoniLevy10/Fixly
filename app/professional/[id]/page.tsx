import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProfessionalProfileView from '@/components/professionals/ProfessionalProfileView'
import JsonLd from '@/components/seo/JsonLd'
import SeoBreadcrumbs from '@/components/seo/SeoBreadcrumbs'
import SeoLandingTracker from '@/components/seo/SeoLandingTracker'
import ProListCard from '@/components/professionals/ProListCard'
import {
  getProfessional,
  listProfessionals,
  listRealProfessionalsForSeo,
} from '@/lib/data/professionals-service'
import { isSeedDemoProfessionalId } from '@/lib/data/seed-professionals'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/site-config'
import {
  resolveInternalLinkCitySlug,
  resolveSeoCityAndCategory,
} from '@/lib/seo/resolve-location'
import { getCityBySlug } from '@/lib/seo/marketplace-pages'
import {
  buildBreadcrumbListSchema,
  buildProfessionalServiceSchema,
} from '@/lib/seo/schema'

type ProfessionalPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: ProfessionalPageProps): Promise<Metadata> {
  const { id } = await params
  const pro = await getProfessional(id)
  if (!pro) {
    return { title: 'איש מקצוע', robots: { index: false, follow: false } }
  }

  const { city, category } = resolveSeoCityAndCategory(pro)
  const isDemo = isSeedDemoProfessionalId(pro.id)
  const cityPart = city?.nameHe ? ` ב${city.nameHe}` : ''
  const catPart = category?.nameHe ?? pro.title ?? pro.category
  const title = `${pro.name} — ${catPart}${cityPart}`
  const description =
    pro.description?.slice(0, 160) ||
    `${pro.name}, ${catPart}${cityPart}. דירוג ${pro.rating.toFixed(1)} (${pro.reviewCount} ביקורות) — Fixly.`
  const canonical = `${SITE_URL}${routes.professional(pro.id)}`

  return {
    title,
    description,
    alternates: { canonical },
    robots:
      isDemo || !pro.isApproved
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: 'he_IL',
      type: 'profile',
      images: pro.avatarUrl
        ? [{ url: pro.avatarUrl }]
        : [{ url: `${SITE_URL}/icons/icon-512.png` }],
    },
  }
}

export default async function ProfessionalPage({ params }: ProfessionalPageProps) {
  const { id } = await params
  const pro = await getProfessional(id)

  if (!pro) {
    notFound()
  }

  const resolved = resolveSeoCityAndCategory(pro)
  // Prefer Jerusalem when pro location is missing/unknown (organic cluster).
  const citySlug = pro.location?.trim()
    ? resolved.citySlug
    : resolveInternalLinkCitySlug(pro.location)
  const categorySlug = resolved.categorySlug
  const city = getCityBySlug(citySlug) ?? resolved.city
  const category = resolved.category
  const servicesHref =
    categorySlug && citySlug ? routes.services(citySlug, categorySlug) : null
  const isDemo = isSeedDemoProfessionalId(pro.id)

  let related = categorySlug
    ? (
        await listRealProfessionalsForSeo({
          categorySlug,
          query: city?.query,
        })
      ).filter((p) => p.id !== pro.id)
    : []

  if (related.length < 3 && categorySlug) {
    const fallback = (await listProfessionals({ categorySlug })).filter(
      (p) => p.id !== pro.id && !related.some((r) => r.id === p.id),
    )
    related = [...related, ...fallback]
  }
  related = related.slice(0, 6)

  const breadcrumbUi = [
    { name: 'Fixly', href: routes.home },
    ...(servicesHref && city && category
      ? [
          {
            name: category.nameHe,
            href: routes.professionalsCategory(categorySlug!),
          },
          {
            name: `${category.nameHe} ב${city.nameHe}`,
            href: servicesHref,
          },
        ]
      : [{ name: 'אנשי מקצוע', href: routes.professionals }]),
    { name: pro.name },
  ]

  const breadcrumbLd = buildBreadcrumbListSchema([
    { name: 'Fixly', path: routes.home },
    ...(servicesHref && city && category
      ? [
          {
            name: `${category.nameHe} ב${city.nameHe}`,
            path: servicesHref,
          },
        ]
      : [{ name: 'אנשי מקצוע', path: routes.professionals }]),
    { name: pro.name, path: routes.professional(pro.id) },
  ])

  const profileLd = buildProfessionalServiceSchema(pro, {
    cityNameHe: city?.nameHe,
    categoryNameHe: category?.nameHe,
  })

  return (
    <>
      <SeoLandingTracker
        pageType="pro_profile"
        category={categorySlug ?? undefined}
        city={citySlug}
        indexable={!isDemo && pro.isVerified}
      />
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={profileLd} />
      <div className="max-w-5xl mx-auto px-4 pt-4 lg:px-8">
        <SeoBreadcrumbs items={breadcrumbUi} />
        {servicesHref && city && category ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link
              href={servicesHref}
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              עוד {category.nameHe} ב{city.nameHe}
            </Link>
          </p>
        ) : null}
      </div>
      <ProfessionalProfileView pro={pro} />
      {related.length > 0 ? (
        <section
          aria-labelledby="related-pros-heading"
          className="max-w-5xl mx-auto px-4 pb-10 lg:px-8 space-y-3"
        >
          <h2 id="related-pros-heading" className="text-lg font-bold">
            אנשי מקצוע דומים
          </h2>
          <div className="space-y-3">
            {related.map((relatedPro) => (
              <ProListCard key={relatedPro.id} professional={relatedPro} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
