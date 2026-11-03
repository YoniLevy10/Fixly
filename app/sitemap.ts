import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'

/**
 * Marketing-domain sitemap only.
 * fixly.tech is the indexed host and must not advertise product/marketplace URLs
 * (`/professionals`, `/services/...`, profiles). Full product lives on PRODUCT_URL.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL

  const marketingPaths = ['', '/waitlist', '/for-professionals', '/about', '/privacy', '/terms'] as const

  return marketingPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' || path === '/waitlist' ? 1 : path === '/for-professionals' ? 0.9 : 0.7,
  }))
}
