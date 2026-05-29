'use client'

import { useCallback, useRef, useState } from 'react'
import { featureFlags } from '@/lib/feature-flags'

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [pulling, setPulling] = useState(false)
  const startY = useRef(0)
  const pullingRef = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!featureFlags.pullToRefresh) return
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    pullingRef.current = true
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current) return
    const delta = e.touches[0].clientY - startY.current
    setPulling(delta > 60)
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return
    pullingRef.current = false
    if (pulling) await onRefresh()
    setPulling(false)
  }, [pulling, onRefresh])

  return { pulling, onTouchStart, onTouchMove, onTouchEnd }
}
