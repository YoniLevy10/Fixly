import { isSupabaseEnabled, shouldUseMockFallback } from '@/lib/data/config'

export type DataBackend = 'supabase' | 'mock' | 'none'

export function resolveDataBackend(): DataBackend {
  if (isSupabaseEnabled()) return 'supabase'
  if (shouldUseMockFallback()) return 'mock'
  return 'none'
}
