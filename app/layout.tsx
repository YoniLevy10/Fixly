import type { Metadata, Viewport } from 'next'
import AppLayout from '@/components/layout/AppLayout'
import AppProviders from '@/components/providers/AppProviders'
import SWRegister from '@/components/pwa/SWRegister'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Fixly — Repairs & Professionals', template: '%s | Fixly' },
  description: 'Find a home repair professional quickly — Fixly',
  applicationName: 'Fixly',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fixly',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#123563',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <AppProviders>
          <AppLayout>{children}</AppLayout>
        </AppProviders>
        <SWRegister />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
