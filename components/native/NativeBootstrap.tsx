'use client'

import { useEffect } from 'react'
import { isNativeApp } from '@/lib/native/platform'

/**
 * Configures the native shell (status bar, splash, body class) on Capacitor only.
 */
export default function NativeBootstrap() {
  useEffect(() => {
    if (!isNativeApp()) return

    document.documentElement.classList.add('native-app')
    document.body.classList.add('native-app')

    void (async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: '#152a4a' })
      } catch {
        /* plugin unavailable on web */
      }

      try {
        const { SplashScreen } = await import('@capacitor/splash-screen')
        await SplashScreen.hide()
      } catch {
        /* ignore */
      }

      try {
        const { App } = await import('@capacitor/app')
        void App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) document.body.classList.remove('app-backgrounded')
          else document.body.classList.add('app-backgrounded')
        })
      } catch {
        /* ignore */
      }
    })()

    return () => {
      document.documentElement.classList.remove('native-app')
      document.body.classList.remove('native-app', 'app-backgrounded')
    }
  }, [])

  return null
}
