'use client'

import { useCallback, useEffect, useState } from 'react'
import type { LiveTrackingState } from '@/lib/tracking/types'

const POLL_MS = 5000

export function useLiveTracking(
  requestId: string | undefined,
  enabled: boolean
) {
  const [tracking, setTracking] = useState<LiveTrackingState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!requestId || !enabled) return
    try {
      const res = await fetch(`/api/requests/${requestId}/location`)
      if (!res.ok) throw new Error('טעינת מיקום נכשלה')
      setTracking(await res.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    }
  }, [requestId, enabled])

  useEffect(() => {
    if (!enabled || !requestId) {
      setTracking(null)
      return
    }
    refresh()
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [enabled, requestId, refresh])

  return { tracking, error, refresh }
}
