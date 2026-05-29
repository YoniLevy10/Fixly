'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth/auth-provider'
import { LocaleProvider } from '@/lib/i18n/locale-provider'
import NativeBootstrap from '@/components/native/NativeBootstrap'

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <NativeBootstrap />
        {children}
      </AuthProvider>
    </LocaleProvider>
  )
}
