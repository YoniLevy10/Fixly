import type { MetadataRoute } from 'next'
import { SEO_CATEGORIES, SEO_CITIES, seoPagePath } from '@/lib/seo/marketplace-pages'
import { SITE_URL } from '@/lib/site-config'
import { featureFlags } from '@/lib/feature-flags'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL

  const staticPages = [
    '',
    '/waitlist',
    '/professionals',
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

  return [...staticPages, ...seoPages]
}
