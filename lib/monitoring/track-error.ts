import * as Sentry from '@sentry/nextjs'

const hasSentry = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
)

/**
 * Report errors to Sentry in production when DSN is set; always log in development.
 */
export function trackError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[trackError]', error, context)
    return
  }

  if (hasSentry) {
    Sentry.captureException(error, { extra: context })
  }
}
