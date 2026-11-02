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

/**
 * Marketing-domain sitemap (fixly.tech).
 * Includes registration pages + national SEO hubs + indexable city×trade pairs only.
 * Omits thin pages and product-only deep links (profiles stay on PRODUCT_URL).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/waitlist',
    '/pro/join',
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
    priority:
      path === ''
        ? 1
        : path === '/waitlist' || path === '/for-professionals'
          ? 0.9
          : 0.7,
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

  return [...staticPages, ...categoryHubs, ...locationHubs, ...indexablePairs]
}
