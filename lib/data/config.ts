import { publicEnv } from '@/lib/env/public-env'

export function isSupabaseEnabled(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey)
}
