'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MockRequest, CreateRequestInput } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'

export function useRequestsList(params?: {
  customerId?: string
  professionalId?: string
}) {
  const [requests, setRequests] = useState<MockRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = new URLSearchParams()
  if (params?.customerId) query.set('customerId', params.customerId)
  if (params?.professionalId) query.set('professionalId', params.professionalId)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/requests?${query.toString()}`)
      if (!res.ok) throw new Error('טעינה נכשלה')
      setRequests(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setLoading(false)
    }
  }, [params?.customerId, params?.professionalId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { requests, loading, error, refresh }
}

export async function createRequestApi(input: CreateRequestInput): Promise<MockRequest> {
  const res = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'יצירת בקשה נכשלה')
  }
  return res.json()
}

export async function updateRequestStatusApi(
  id: string,
  status: RequestStatus,
  extra?: { cancellationReason?: string }
): Promise<MockRequest> {
  const res = await fetch(`/api/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...extra }),
  })
  if (!res.ok) throw new Error('עדכון נכשל')
  return res.json()
}
