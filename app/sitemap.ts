import type { MetadataRoute } from 'next'
import { SEO_CATEGORIES, SEO_CITIES, seoPagePath } from '@/lib/seo/marketplace-pages'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fixly.vercel.app'

  const staticPages = ['', '/professionals', '/pro/join', '/about'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  const seoPages = SEO_CITIES.flatMap((city) =>
    SEO_CATEGORIES.map((cat) => ({
      url: `${base}${seoPagePath(city.slug, cat.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  )

  return [...staticPages, ...seoPages]
}
