'use client'

import { useCallback, useState } from 'react'
import { featureFlags } from '@/lib/feature-flags'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.ready
}

export function usePush() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!featureFlags.pushNotifications) return false
    setLoading(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('permission_denied')
        return false
      }

      const keyRes = await fetch('/api/push/vapid-key')
      if (!keyRes.ok) {
        setError('vapid_unavailable')
        return false
      }
      const { publicKey } = (await keyRes.json()) as { publicKey?: string }
      if (!publicKey) {
        setError('vapid_unavailable')
        return false
      }

      const reg = await getRegistration()
      if (!reg?.pushManager) {
        setError('unsupported')
        return false
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      })

      if (!res.ok) {
        setError('subscribe_failed')
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'subscribe_failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const reg = await getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (!sub) return true

      const endpoint = sub.endpoint
      await sub.unsubscribe()

      const res = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })

      if (!res.ok) {
        setError('unsubscribe_failed')
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unsubscribe_failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { subscribe, unsubscribe, loading, error }
}
