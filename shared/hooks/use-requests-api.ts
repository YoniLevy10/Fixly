'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MockRequest, CreateRequestInput } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'

const PAGE_SIZE = 20

export function useRequestsList(params?: { scope?: 'mine' | 'pro' }) {
  const [requests, setRequests] = useState<MockRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const hasLoadedRef = useRef(false)
  const scope = params?.scope

  const refresh = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft ?? hasLoadedRef.current
    if (soft) setRefreshing(true)
    else setLoading(true)
    setError(null)
    setOffset(0)
    try {
      const query = new URLSearchParams()
      if (scope) query.set('scope', scope)
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
      hasLoadedRef.current = true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [scope])

  const loadMore = useCallback(async () => {
    if (!hasMore) return
    const query = new URLSearchParams()
    if (scope) query.set('scope', scope)
    query.set('limit', String(PAGE_SIZE))
    query.set('offset', String(offset))
    const res = await fetch(`/api/requests?${query}`)
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) return
    setRequests((prev) => [...prev, ...(data.items ?? [])])
    setHasMore(Boolean(data.hasMore))
    setOffset((o) => o + PAGE_SIZE)
  }, [hasMore, offset, scope])

  useEffect(() => {
    hasLoadedRef.current = false
    void refresh({ soft: false })
  }, [refresh])

  return { requests, loading, refreshing, error, refresh, hasMore, loadMore }
}

export class RegionClosedError extends Error {
  code = 'REGION_CLOSED' as const
  waitlistPath: string
  city: string

  constructor(message: string, waitlistPath: string, city = '') {
    super(message)
    this.name = 'RegionClosedError'
    this.waitlistPath = waitlistPath
    this.city = city
  }
}

export async function createRequestApi(
  input: Omit<CreateRequestInput, 'customerId'> & {
    customerName: string
    matchMode?: boolean
    referralCode?: string
    categorySlug?: string
    city?: string
    idempotencyKey?: string
  },
): Promise<MockRequest> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (input.idempotencyKey) {
    headers['Idempotency-Key'] = input.idempotencyKey
  }
  const res = await fetch('/api/requests', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (err.code === 'REGION_CLOSED' || res.status === 403) {
      throw new RegionClosedError(
        err.error || 'האזור עדיין לא פתוח לצרכנים',
        err.waitlistPath || '/waitlist',
        err.city || input.city || '',
      )
    }
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
