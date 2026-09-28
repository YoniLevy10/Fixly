import { isDemoDataMode } from '@/lib/data/demo-mode'
import { isProduction } from '@/lib/data/config'
import { isSupabaseEnabled } from '@/lib/data/config'
import { isGrowPlatformConfigured } from '@/lib/grow/config'
import { featureFlags } from '@/lib/feature-flags'

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
      'Demo mode ON — set NEXT_PUBLIC_FF_DEMO_DATA=false (or omit) and redeploy for real data.',
    )
  }

  if (!isSupabaseEnabled()) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!appUrl) {
    warnings.push(
      'NEXT_PUBLIC_APP_URL unset — defaulting to https://fixly.tech for redirects',
    )
  } else if (!/^https:\/\//i.test(appUrl)) {
    errors.push('NEXT_PUBLIC_APP_URL must be an https:// URL')
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

  if (featureFlags.monetization) {
    if (!isGrowPlatformConfigured()) {
      warnings.push(
        'Grow not configured (GROW_API_KEY / GROW_PAGE_CODE / GROW_WEBHOOK_SECRET) — checkout disabled',
      )
    }
  } else {
    warnings.push('Monetization deferred — payments via Grow later (NEXT_PUBLIC_FF_MONETIZATION=false)')
  }

  if (
    process.env.NEXT_PUBLIC_FF_ANALYTICS === 'false' &&
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  ) {
    warnings.push(
      'NEXT_PUBLIC_GA_MEASUREMENT_ID is set but NEXT_PUBLIC_FF_ANALYTICS=false — gtag will not load',
    )
  }

  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()) {
    warnings.push(
      'NEXT_PUBLIC_META_PIXEL_ID missing — Meta Ads cannot optimize for CompleteRegistration',
    )
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
