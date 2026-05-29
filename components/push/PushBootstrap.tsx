'use client'

import { useEffect } from 'react'
import { registerPushNotifications } from '@/lib/push/notifications'
import { featureFlags } from '@/lib/feature-flags'

export default function PushBootstrap() {
  useEffect(() => {
    if (!featureFlags.pushNotifications) return
    void registerPushNotifications()
  }, [])

  return null
}
