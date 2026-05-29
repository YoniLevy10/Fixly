import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env/public-env'
import { isSupabaseEnabled } from '@/lib/data/config'

export function createBrowserSupabaseClient() {
  if (!isSupabaseEnabled()) return null
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey)
}
