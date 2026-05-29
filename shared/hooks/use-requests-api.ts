'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MockRequest, CreateRequestInput } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'

const PAGE_SIZE = 20

export function useRequestsList(params?: { scope?: 'mine' | 'pro' }) {
  const [requests, setRequests] = useState<MockRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    setOffset(0)
    try {
      const query = new URLSearchParams()
      if (params?.scope) query.set('scope', params.scope)
      query.set('limit', String(PAGE_SIZE))
      query.set('offset', '0')
      const res = await fetch(`/api/requests?${query}`)
      if (!res.ok) throw new Error('טעינה נכשלה')
      const data = await res.json()
      if (Array.isArray(data)) {
        setRequests(data)
        setHasMore(false)
      } else {
        setRequests(data.items ?? [])
        setHasMore(Boolean(data.hasMore))
        setOffset(PAGE_SIZE)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setLoading(false)
    }
  }, [params?.scope])

  const loadMore = useCallback(async () => {
    if (!hasMore) return
    const query = new URLSearchParams()
    if (params?.scope) query.set('scope', params.scope)
    query.set('limit', String(PAGE_SIZE))
    query.set('offset', String(offset))
    const res = await fetch(`/api/requests?${query}`)
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) return
    setRequests((prev) => [...prev, ...(data.items ?? [])])
    setHasMore(Boolean(data.hasMore))
    setOffset((o) => o + PAGE_SIZE)
  }, [hasMore, offset, params?.scope])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { requests, loading, error, refresh, hasMore, loadMore }
}

export async function createRequestApi(
  input: Omit<CreateRequestInput, 'customerId'> & { customerName: string }
): Promise<MockRequest> {
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
  extra?: { cancellationReason?: string; quotedAmount?: number }
): Promise<MockRequest> {
  const res = await fetch(`/api/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...extra }),
  })
  if (!res.ok) throw new Error('עדכון נכשל')
  return res.json()
}
