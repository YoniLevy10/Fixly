import type { RequestRepository } from '@/lib/repositories/request-repository'

import { mockRequestRepository } from '@/mock/mock-request-repository'
import { supabaseRequestRepository } from '@/supabase/repositories/supabase-request-repository'

export function createRequestRepository(): RequestRepository {
  const useSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return useSupabase
    ? supabaseRequestRepository
    : mockRequestRepository
}
