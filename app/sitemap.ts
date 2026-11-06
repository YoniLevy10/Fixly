import type { MetadataRoute } from 'next'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  categoryHubPath,
  locationHubPath,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import {
  categoryHasIndexablePair,
  cityHasIndexablePair,
  resolveSeoIndexValue,
} from '@/lib/seo/has-seo-value'
import { SITE_URL } from '@/lib/site-config'

/**
 * Marketing-domain sitemap (fixly.tech).
 * `/` is the professional registration page. `/waitlist` and `/pro/join`
 * render or redirect to that same screen, so they stay out of the sitemap.
 * City×trade URLs are included only when they have a real professional or
 * verified demand. Empty hubs are omitted.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/for-professionals',
    '/professionals',
    '/locations',
    '/about',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' || path === '/for-professionals' ? 0.9 : 0.7,
  }))
  staticPages[0] = { ...staticPages[0], priority: 1 }

  const categoryHubs: MetadataRoute.Sitemap = []
  for (const cat of SEO_CATEGORIES) {
    if (!(await categoryHasIndexablePair(cat.slug))) continue
    categoryHubs.push({
      url: `${base}${categoryHubPath(cat.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  }

  const locationHubs: MetadataRoute.Sitemap = []
  for (const city of SEO_CITIES) {
    if (!(await cityHasIndexablePair(city.query))) continue
    locationHubs.push({
      url: `${base}${locationHubPath(city.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

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
