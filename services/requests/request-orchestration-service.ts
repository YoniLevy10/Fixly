import type { MarketplaceRequest } from '@/types/marketplace-request'

import { validateMarketplaceRequest } from '@/services/requests/request-validation-service'
import { supabaseRequestRepository } from '@/supabase/repositories/supabase-request-repository'

export async function createMarketplaceRequest(
  request: MarketplaceRequest
) {
  const validation = validateMarketplaceRequest(request)

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    }
  }

  await supabaseRequestRepository.create(request)

  return {
    success: true,
  }
}
