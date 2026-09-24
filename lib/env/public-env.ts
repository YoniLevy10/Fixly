/** Canonical production URL — never leave empty (breaks OAuth / share links). */
const DEFAULT_APP_URL = 'https://fixly.tech'

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL,
}
