import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Demo data ON by default (investor / candidacy preview). Set false for live Supabase-only. */
  env: {
    NEXT_PUBLIC_FF_DEMO_DATA: process.env.NEXT_PUBLIC_FF_DEMO_DATA ?? 'true',
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/my-requests', permanent: false },
      { source: '/pro-dashboard', destination: '/pro/dashboard', permanent: false },
      { source: '/tracking', destination: '/my-requests', permanent: false },
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
