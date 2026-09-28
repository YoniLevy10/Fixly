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
      // Dead marketing stubs → waitlist (kept for old campaign URLs)
      { source: '/go', destination: '/waitlist', permanent: true },
      { source: '/go/:path*', destination: '/waitlist', permanent: true },
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
