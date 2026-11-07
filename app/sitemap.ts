import type { MetadataRoute } from 'next'
import { listRealProfessionalsForSeo, filterSeoProfessionals } from '@/lib/data/professionals-service'
import {
  SEO_CATEGORIES,
  SEO_CITIES,
  categoryHubPath,
  locationHubPath,
  seoPagePath,
} from '@/lib/seo/marketplace-pages'
import {
  SEO_WAITLIST_DEMAND_THRESHOLD,
  categoryHasAnyProfessional,
  cityHasAnyProfessional,
} from '@/lib/seo/has-seo-value'
import { isSupabaseEnabled } from '@/lib/data/config'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/site-config'

export const revalidate = 3600

async function customerDemandByCitySlug(): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (!isSupabaseEnabled()) return counts
  const admin = getAdminSupabaseClient()
  if (!admin) return counts
  const { data, error } = await admin
    .from('pro_waitlist')
    .select('city')
    .eq('audience', 'customer')
    .not('source', 'ilike', '%smoke%')
    .not('source', 'ilike', '%test%')
    .limit(2000)
  if (error || !data) return counts
  for (const row of data) {
    const city = typeof row.city === 'string' ? row.city : ''
    if (!city.trim()) continue
    for (const known of SEO_CITIES) {
      if (!city.includes(known.query)) continue
      counts.set(known.slug, (counts.get(known.slug) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * Marketing-domain sitemap (fixly.tech).
 * `/` is the professional registration page. `/waitlist` and `/pro/join`
 * render or redirect to that same screen, so they stay out of the sitemap.
 * Hubs index when they have ≥1 approved pro or a qualifying pair.
 * City×trade URLs stay out unless they have supply or verified demand.
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

  const [catalog, demandByCity, categoryHubFlags, cityHubFlags] = await Promise.all([
    listRealProfessionalsForSeo(),
    customerDemandByCitySlug(),
    Promise.all(
      SEO_CATEGORIES.map(async (cat) => ({
        slug: cat.slug,
        include: await categoryHasAnyProfessional(cat.slug),
      })),
    ),
    Promise.all(
      SEO_CITIES.map(async (city) => ({
        slug: city.slug,
        include: await cityHasAnyProfessional(city.query),
      })),
    ),
  ])

  const indexablePairs: MetadataRoute.Sitemap = []
  for (const city of SEO_CITIES) {
    for (const category of SEO_CATEGORIES) {
      const pros = filterSeoProfessionals(catalog, {
        query: city.query,
        categorySlug: category.slug,
      }).filter((p) => p.isApproved)
      const demand = demandByCity.get(city.slug) ?? 0
      if (pros.length === 0 && demand < SEO_WAITLIST_DEMAND_THRESHOLD) continue
      indexablePairs.push({
        url: `${base}${seoPagePath(category.slug, city.slug)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  }

  const categoryHubs: MetadataRoute.Sitemap = categoryHubFlags
    .filter((c) => c.include)
    .map((cat) => ({
      url: `${base}${categoryHubPath(cat.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

  const locationHubs: MetadataRoute.Sitemap = cityHubFlags
    .filter((c) => c.include)
    .map((city) => ({
      url: `${base}${locationHubPath(city.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [...staticPages, ...categoryHubs, ...locationHubs, ...indexablePairs]
}
