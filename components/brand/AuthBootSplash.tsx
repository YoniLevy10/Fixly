'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import AppSplashScreen from '@/components/brand/AppSplashScreen'

/** Keep the branded splash visible long enough to read logo + progress line. */
/** Short boot beat — long splash hurt LCP/FCP on mobile PageSpeed. */
const MIN_SPLASH_MS = 200
/** Never block the waitlist / public pages if auth hangs (missing env, network). */
const MAX_SPLASH_MS = 2500

/**
 * Shows the branded Fixly entry splash while the auth session boots.
 * Matches Bamakor / OpticalCenter boot UX (logo + loading line).
 * Clears html.fixly-booting when done (CSS first-paint gate in root layout).
 */
export default function AuthBootSplash({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [maxTimeElapsed, setMaxTimeElapsed] = useState(false)

  useEffect(() => {
    const minId = window.setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS)
    const maxId = window.setTimeout(() => setMaxTimeElapsed(true), MAX_SPLASH_MS)
    return () => {
      window.clearTimeout(minId)
      window.clearTimeout(maxId)
    }
  }, [])

  const showSplash = (isLoading || !minTimeElapsed) && !maxTimeElapsed

  useEffect(() => {
    if (showSplash) return
    document.documentElement.classList.remove('fixly-booting')
  }, [showSplash])

  return (
    <>
      {children}
      {showSplash ? <AppSplashScreen label="טוען…" /> : null}
    </>
  )
}
