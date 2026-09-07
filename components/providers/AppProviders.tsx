'use client'

import { Suspense, type ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth/auth-provider'
import { LocaleProvider } from '@/lib/i18n/locale-provider'
import { DemoTourProvider } from '@/components/demo/DemoTourProvider'
import AuthBootSplash from '@/components/brand/AuthBootSplash'
import NativeBootstrap from '@/components/native/NativeBootstrap'
import DemoModeBanner from '@/components/demo/DemoModeBanner'
import PushBootstrap from '@/components/push/PushBootstrap'
import OfflineBanner from '@/components/shared/OfflineBanner'
import ReferralCapture from '@/components/shared/ReferralCapture'

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AuthBootSplash>
          <DemoTourProvider>
            <NativeBootstrap />
            <DemoModeBanner />
            <PushBootstrap />
            <Suspense fallback={null}>
              <ReferralCapture />
            </Suspense>
            <OfflineBanner />
            {children}
          </DemoTourProvider>
        </AuthBootSplash>
      </AuthProvider>
    </LocaleProvider>
  )
}
