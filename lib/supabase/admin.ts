import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let admin: SupabaseClient | null = null

/** Service-role client for webhooks and server jobs — never expose to browser */
export function getAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!admin) {
    admin = createClient(url, key, { auth: { persistSession: false } })
  }
  return admin
}
