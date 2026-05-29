'use client'

import type { ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { isNativeApp } from '@/lib/native/platform'

type NativeAwareMainProps = {
  children: ReactNode
  hideNav?: boolean
}

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  const observer = new MutationObserver(cb)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function getNativeClassSnapshot() {
  if (typeof document === 'undefined') return false
  return (
    isNativeApp() || document.documentElement.classList.contains('native-app')
  )
}

/**
 * Adjusts main padding for iOS safe areas + bottom nav when in native shell.
 */
export default function NativeAwareMain({
  children,
  hideNav,
}: NativeAwareMainProps) {
  const isNative = useSyncExternalStore(
    subscribe,
    getNativeClassSnapshot,
    () => false
  )

  const mainClass = hideNav
    ? 'min-h-screen native-main'
    : isNative
      ? 'min-h-screen native-main pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] px-0'
      : 'min-h-screen pb-24 lg:pb-8 px-0 lg:px-8'

  return (
    <main className={mainClass}>
      <div className="w-full mx-auto max-w-6xl native-content">{children}</div>
    </main>
  )
}
