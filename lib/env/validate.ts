import { isDemoDataMode } from '@/lib/data/demo-mode'
import { isProduction } from '@/lib/data/config'
import { isSupabaseEnabled } from '@/lib/data/config'

export type EnvValidationResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export function validateProductionEnv(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isProduction()) {
    return { ok: true, errors, warnings }
  }

  if (isDemoDataMode()) {
    errors.push('NEXT_PUBLIC_FF_DEMO_DATA must be false in production')
  }

  if (!isSupabaseEnabled()) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required for OAuth and Stripe redirects')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY missing — Stripe webhooks and admin API will not work')
  }

  if (process.env.NEXT_PUBLIC_FF_MONETIZATION !== 'false') {
    if (!process.env.STRIPE_SECRET_KEY) {
      warnings.push('STRIPE_SECRET_KEY missing — monetization checkout disabled')
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      warnings.push('STRIPE_WEBHOOK_SECRET missing — subscription webhooks rejected')
    }
    if (!process.env.STRIPE_PRICE_PRO_MONTHLY) {
      warnings.push('STRIPE_PRICE_PRO_MONTHLY missing — Pro checkout disabled')
    }
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    warnings.push('Upstash Redis not configured — rate limits are per-instance only')
  }

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    warnings.push('NEXT_PUBLIC_SENTRY_DSN missing — error monitoring disabled')
  }

  if (!process.env.ADMIN_EMAILS?.trim()) {
    warnings.push('ADMIN_EMAILS not set — /admin panel inaccessible')
  }

  return { ok: errors.length === 0, errors, warnings }
}

export function logProductionEnvStatus(): void {
  const result = validateProductionEnv()
  if (result.errors.length) {
    console.error('[env] Production configuration errors:', result.errors.join('; '))
  }
  if (result.warnings.length) {
    console.warn('[env] Production configuration warnings:', result.warnings.join('; '))
  }
}
