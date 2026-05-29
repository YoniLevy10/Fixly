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

    const load = () => {
      const url = demoPro
        ? '/api/requests?scope=pro&professionalId=1'
        : '/api/requests?scope=pro'
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (!Array.isArray(data)) return setCount(0)
          setCount(data.filter((r: { status: string }) => r.status === 'pending').length)
        })
        .catch(() => setCount(0))
    }

    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [user.role, user.professionalId])

  return count
}
