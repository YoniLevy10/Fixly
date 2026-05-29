import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

/** Browser Supabase client (auth + realtime). Returns null when env is missing. */
export function getSupabaseClient() {
  return createBrowserSupabaseClient()
}
