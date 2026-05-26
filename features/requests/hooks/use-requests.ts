import { useEffect, useState } from 'react'

import type { MarketplaceRequest } from '@/types/marketplace-request'
import { supabaseRequestRepository } from '@/supabase/repositories/supabase-request-repository'

export function useRequests() {
  const [requests, setRequests] = useState<MarketplaceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true)

        const data = await supabaseRequestRepository.getAll()

        setRequests(data)
      } catch (err) {
        setError('Failed to fetch requests')
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [])

  return {
    requests,
    loading,
    error,
  }
}
