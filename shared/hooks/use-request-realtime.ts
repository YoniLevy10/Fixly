'use client'

import { useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { MockRequest } from '@/mock/requests'

export function useRequestRealtime(
  requestId: string | undefined,
  onUpdate: (request: MockRequest) => void
) {
  useEffect(() => {
    if (!requestId) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`,
        },
        async () => {
          const res = await fetch(`/api/requests/${requestId}`)
          if (res.ok) {
            const data = await res.json()
            onUpdate(data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId, onUpdate])
}

export function useRequestsListRealtime(onRefresh: () => void) {
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    const channel = supabase
      .channel('requests-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => onRefresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onRefresh])
}
