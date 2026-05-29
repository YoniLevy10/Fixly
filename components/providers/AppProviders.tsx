'use client'

import { Suspense, type ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth/auth-provider'
import { LocaleProvider } from '@/lib/i18n/locale-provider'
import NativeBootstrap from '@/components/native/NativeBootstrap'
import OfflineBanner from '@/components/shared/OfflineBanner'
import ReferralCapture from '@/components/shared/ReferralCapture'

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <NativeBootstrap />
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        <OfflineBanner />
        {children}
      </AuthProvider>
    </LocaleProvider>
  )
}
