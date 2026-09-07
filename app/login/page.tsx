import type { Metadata } from 'next'
import LoginScreen from '@/components/auth/LoginScreen'

export const metadata: Metadata = {
  title: 'כניסה',
  description: 'התחברות ל-Fixly',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginScreen />
}
