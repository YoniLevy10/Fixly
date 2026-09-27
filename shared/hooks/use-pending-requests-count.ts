'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { isDemoDataMode } from '@/lib/data/demo-mode'

export function usePendingRequestsCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const demoPro = isDemoDataMode()
    if (!demoPro && (user.role !== 'professional' || !user.professionalId)) {
      setCount(0)
      return
    }

    let cancelled = false
    const load = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }
      const url = demoPro
        ? '/api/requests?scope=pro&professionalId=1&limit=20'
        : '/api/requests?scope=pro&limit=20'
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return
          const items = Array.isArray(data) ? data : data.items ?? []
          setCount(
            items.filter((r: { status: string }) => r.status === 'pending').length,
          )
        })
        .catch(() => {
          if (!cancelled) setCount(0)
        })
    }

    load()
    const id = setInterval(load, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [user.role, user.professionalId])

  return count
}
