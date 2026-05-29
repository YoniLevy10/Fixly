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
          if (res.ok) onUpdate(await res.json())
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [requestId, onUpdate])
}

type ListRealtimeOptions = {
  customerId?: string
  professionalId?: string
  enabled?: boolean
}

export function useRequestsListRealtime(
  onRefresh: () => void,
  options?: ListRealtimeOptions
) {
  const { customerId, professionalId, enabled = true } = options ?? {}

  useEffect(() => {
    if (!enabled) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    const filter = customerId
      ? `customer_id=eq.${customerId}`
      : professionalId
        ? `professional_id=eq.${professionalId}`
        : null

    if (!filter) return

    let debounce: ReturnType<typeof setTimeout> | null = null
    const debouncedRefresh = () => {
      if (document.visibilityState === 'hidden') return
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(onRefresh, 400)
    }

    const channel = supabase
      .channel(`requests-list-${filter}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter,
        },
        debouncedRefresh
      )
      .subscribe()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onRefresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (debounce) clearTimeout(debounce)
      void supabase.removeChannel(channel)
    }
  }, [customerId, professionalId, enabled, onRefresh])
}
