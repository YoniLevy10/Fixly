/**
 * Grow (Meshulam) — future payment provider for Fixly (same stack as Bino).
 *
 * Payments are deferred for the nationwide launch. When ready, set:
 *   GROW_API_KEY, GROW_PAGE_CODE, GROW_WEBHOOK_SECRET
 *   GROW_ENV=sandbox|production (default production)
 *
 * Docs: docs/PAYMENTS_GROW.md
 */

export type GrowEnv = 'sandbox' | 'production'

export const GROW_API_BASE_URLS: Record<GrowEnv, string> = {
  sandbox: 'https://sandbox.meshulam.co.il/api/light/server/1.0',
  production: 'https://secure.meshulam.co.il/api/light/server/1.0',
}

export function parseGrowEnv(raw: string | null | undefined): GrowEnv {
  return raw === 'sandbox' ? 'sandbox' : 'production'
}

export type GrowPlatformConfig = {
  env: GrowEnv
  apiKey: string
  pageCode: string
  webhookSecret: string
}

export function readGrowPlatformConfig(): GrowPlatformConfig | null {
  const apiKey = (process.env.GROW_API_KEY || '').trim()
  const pageCode = (process.env.GROW_PAGE_CODE || '').trim()
  const webhookSecret = (process.env.GROW_WEBHOOK_SECRET || '').trim()
  if (!apiKey || !pageCode || !webhookSecret) return null
  return {
    env: parseGrowEnv(process.env.GROW_ENV),
    apiKey,
    pageCode,
    webhookSecret,
  }
}

export function isGrowPlatformConfigured(): boolean {
  return readGrowPlatformConfig() != null
}

export function growApiBaseUrl(env: GrowEnv = 'production'): string {
  return GROW_API_BASE_URLS[env]
}

/** Grow rejects many symbols in form fields. */
export function sanitizeGrowPlainText(value: string, maxLen = 80): string {
  return value
    .replace(/[<>"'#?&\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}
