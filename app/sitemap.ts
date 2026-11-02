import type { MetadataRoute } from 'next'
import { SEO_CATEGORIES, SEO_CITIES, seoPagePath } from '@/lib/seo/marketplace-pages'
import { SITE_URL } from '@/lib/site-config'
import { featureFlags } from '@/lib/feature-flags'
import { listRealProfessionalsForSeo } from '@/lib/data/professionals-service'
import { routes } from '@/lib/routes'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL

  const staticPages = [
    '',
    '/waitlist',
    '/professionals',
    '/categories',
    '/pro/join',
    '/about',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' || path === '/waitlist' ? 1 : 0.7,
  }))

  // During pre-launch, prioritize waitlist URLs; still include SEO city pages for organic demand
  const seoPages = SEO_CITIES.flatMap((city) =>
    SEO_CATEGORIES.map((cat) => ({
      url: `${base}${seoPagePath(city.slug, cat.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: featureFlags.prelaunch ? 0.6 : 0.7,
    })),
  )

  // Real (non-seed) professional profiles only — same filter as SEO list
  let profilePages: MetadataRoute.Sitemap = []
  try {
    const realPros = await listRealProfessionalsForSeo()
    profilePages = realPros.map((pro) => ({
      url: `${base}${routes.professional(pro.id)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    }))
  } catch {
    profilePages = []
  }

  return [...staticPages, ...seoPages, ...profilePages]
}
