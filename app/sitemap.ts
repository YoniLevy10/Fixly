import type { MetadataRoute } from 'next'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  categoryHubPath,
  locationHubPath,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import { resolveSeoIndexValue } from '@/lib/seo/has-seo-value'
import { SITE_URL } from '@/lib/site-config'
import { listRealProfessionalsForSeo } from '@/lib/data/professionals-service'
import { isSeedDemoProfessionalId } from '@/lib/data/seed-professionals'
import { routes } from '@/lib/routes'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/waitlist',
    '/for-professionals',
    '/professionals',
    '/locations',
    '/about',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/waitlist' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/waitlist' || path === '/for-professionals' ? 0.9 : 0.7,
  }))

  const categoryHubs: MetadataRoute.Sitemap = SEO_CATEGORIES.map((cat) => ({
    url: `${base}${categoryHubPath(cat.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  const locationHubs: MetadataRoute.Sitemap = SEO_CITIES.map((city) => ({
    url: `${base}${locationHubPath(city.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Only advertise city×category URLs that pass the real-value gate
  const pairEntries = await Promise.all(
    SEO_CITIES.flatMap((city) =>
      SEO_CATEGORIES.map(async (category) => {
        const seo = await resolveSeoIndexValue({
          cityQuery: city.query,
          categorySlug: category.slug,
        })
        if (!seo.hasValue) return null
        return {
          url: `${base}${seoPagePath(category.slug, city.slug)}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }
      }),
    ),
  )
  const indexablePairs = pairEntries.filter(
    (e): e is NonNullable<typeof e> => e != null,
  )

  // Public pro profiles with real ratings/identity only (no seed demos)
  let proProfiles: MetadataRoute.Sitemap = []
  try {
    const pros = await listRealProfessionalsForSeo()
    proProfiles = pros
      .filter((p) => p.isApproved && !isSeedDemoProfessionalId(p.id))
      .slice(0, 200)
      .map((p) => ({
        url: `${base}${routes.professional(p.id)}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.55,
      }))
  } catch {
    proProfiles = []
  }

  return [
    ...staticPages,
    ...categoryHubs,
    ...locationHubs,
    ...indexablePairs,
    ...proProfiles,
  ]
}
