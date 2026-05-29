/**
 * Error tracking stub — wire to Sentry when SENTRY_DSN is set.
 */
export function trackError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[trackError]', error, context)
    return
  }

  if (process.env.SENTRY_DSN) {
    // import('@sentry/nextjs').then((S) => S.captureException(error, { extra: context }))
  }
}
