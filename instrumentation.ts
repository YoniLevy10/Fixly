import * as Sentry from '@sentry/nextjs'
import { logProductionEnvStatus } from '@/lib/env/validate'

export async function register() {
  logProductionEnvStatus()

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
