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
    warnings.push(
      'Demo mode ON (pre-funding). After investment set NEXT_PUBLIC_FF_DEMO_KILL=true and redeploy.',
    )
  }

  if (!isSupabaseEnabled()) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required for OAuth and payment redirects')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push(
      'SUPABASE_SERVICE_ROLE_KEY missing — partner /api/v1/jobs, payment webhooks, and admin API will not work',
    )
  }

  if (!process.env.FIXLY_API_KEYS?.trim() && !process.env.FIXLY_API_KEY?.trim()) {
    warnings.push('FIXLY_API_KEYS missing — Bamakor/partner job API rejects production requests')
  }

  if (!process.env.BAMAKOR_WEBHOOK_SECRET?.trim()) {
    warnings.push('BAMAKOR_WEBHOOK_SECRET missing — outbound status webhooks unsigned')
  }

  if (process.env.NEXT_PUBLIC_FF_MONETIZATION !== 'false') {
    if (!process.env.TRANZILA_TERMINAL) {
      warnings.push('TRANZILA_TERMINAL missing — monetization checkout disabled')
    }
    if (!process.env.TRANZILA_API_APP_KEY || !process.env.TRANZILA_API_SECRET_KEY) {
      warnings.push('TRANZILA_API_APP_KEY / TRANZILA_API_SECRET_KEY missing — checkout disabled')
    }
    if (!process.env.TRANZILA_WEBHOOK_SECRET?.trim()) {
      warnings.push(
        'TRANZILA_WEBHOOK_SECRET missing — /api/tranzila/webhook accepts unsigned notifications',
      )
    }
  }

  if (process.env.NEXT_PUBLIC_FF_ANALYTICS === 'true' && !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    warnings.push('NEXT_PUBLIC_FF_ANALYTICS=true but NEXT_PUBLIC_GA_MEASUREMENT_ID missing')
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
