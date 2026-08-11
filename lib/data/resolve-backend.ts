import { isSupabaseEnabled } from '@/lib/data/config'
import { isDemoDataMode } from '@/lib/data/demo-mode'

export type DataBackend = 'supabase' | 'mock' | 'none'

export function resolveDataBackend(): DataBackend {
  if (isDemoDataMode()) return 'mock'
  if (isSupabaseEnabled()) return 'supabase'
  return 'none'
}
