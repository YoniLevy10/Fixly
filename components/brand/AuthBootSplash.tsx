'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import AppSplashScreen from '@/components/brand/AppSplashScreen'

/** Keep the branded splash visible long enough to read logo + progress line. */
const MIN_SPLASH_MS = 900

/**
 * Shows the branded Fixly entry splash while the auth session boots.
 * Matches Bamakor / OpticalCenter boot UX (logo + loading line).
 * Clears html.fixly-booting when done (CSS first-paint gate in root layout).
 */
export default function AuthBootSplash({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS)
    return () => window.clearTimeout(id)
  }, [])

  const showSplash = isLoading || !minTimeElapsed

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
