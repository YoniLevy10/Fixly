import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env/public-env'
import { isSupabaseEnabled } from '@/lib/data/config'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseEnabled()) return null
  if (!client) {
    client = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey)
  }
  return client
}

/** @deprecated Use getSupabaseClient() — may be null when Supabase is not configured */
export const supabase = {
  get auth() {
    const c = getSupabaseClient()
    if (!c) throw new Error('Supabase is not configured')
    return c.auth
  },
  from(table: string) {
    const c = getSupabaseClient()
    if (!c) throw new Error('Supabase is not configured')
    return c.from(table)
  },
}
