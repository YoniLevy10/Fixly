import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
const enabled = Boolean(dsn) && process.env.NODE_ENV === 'production'

function initSentry() {
  Sentry.init({
    dsn,
    // Keep client sampling low so first-load main thread stays free for LCP.
    tracesSampleRate: 0.05,
    enabled,
  })
}

if (enabled && typeof window !== 'undefined') {
  // Defer init past first paint / LCP window.
  const schedule =
    'requestIdleCallback' in window
      ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 4000 })
      : (cb: () => void) => window.setTimeout(cb, 2500)
  schedule(initSentry)
} else if (enabled) {
  initSentry()
}
