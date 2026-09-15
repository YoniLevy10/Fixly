import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Demo ON until funding — tour + mock marketplace. Kill with NEXT_PUBLIC_FF_DEMO_KILL=true. */
  env: {
    NEXT_PUBLIC_FF_DEMO_DATA: 'true',
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/my-requests', permanent: false },
      { source: '/pro-dashboard', destination: '/pro/dashboard', permanent: false },
      { source: '/tracking', destination: '/my-requests', permanent: false },
      // Dead marketing stubs → canonical demand campaign landing
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
