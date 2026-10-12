import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/superadmin',
        '/dashboard',
        '/pro/dashboard',
        '/pro/requests',
        '/pro/pricing',
        '/my-requests',
        '/request/',
        '/chat/',
        '/tracking/',
        '/profile',
        '/login',
        '/demo',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
