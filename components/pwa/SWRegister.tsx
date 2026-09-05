'use client'

import { useEffect } from 'react'

export default function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Force activate fixly-v3 (API no-cache) so investor tour isn't stuck on pending
        reg.update().catch(() => {})
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch(() => {
        // Ignore registration failures (private mode, unsupported, etc.)
      })
  }, [])

  return null
}
