'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'

export function usePendingRequestsCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (user.role !== 'professional' || !user.professionalId) {
      setCount(0)
      return
    }

    const load = () => {
      fetch('/api/requests?scope=pro')
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
