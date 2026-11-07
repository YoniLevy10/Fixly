import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lfzxvmievofvdhxrwggo.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/my-requests', permanent: false },
      { source: '/pro-dashboard', destination: '/pro/dashboard', permanent: false },
      { source: '/tracking', destination: '/my-requests', permanent: false },
      // Legacy directory listed every city×trade pair, including empty ones.
      { source: '/categories', destination: '/professionals', permanent: true },
      // Legacy GSC / backlinks → canonical profession×city SEO URLs.
      // Unknown slugs (for example plumbers) still 404 on the destination;
      // the content slug for plumbers is plumbing.
      {
        source: '/services/:city/:category',
        destination: '/professionals/:category/:city',
        permanent: true,
      },
      // Dead marketing stubs → waitlist (kept for old campaign URLs)
      { source: '/go', destination: '/waitlist', permanent: true },
      { source: '/go/:path*', destination: '/waitlist', permanent: true },
      // Outreach / WhatsApp deep link → unified pro waitlist
      {
        source: '/pro/join',
        destination: '/waitlist?audience=professional',
        permanent: true,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
