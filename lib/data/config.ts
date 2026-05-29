import { publicEnv } from '@/lib/env/public-env'

export function isSupabaseEnabled(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey)
}

/** Mock fallback only in local development when Supabase is not configured */
export function shouldUseMockFallback(): boolean {
  if (isSupabaseEnabled()) return false
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
