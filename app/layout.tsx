import type { Metadata, Viewport } from 'next'
import AppLayout from '@/components/layout/AppLayout'
import AppProviders from '@/components/providers/AppProviders'
import SWRegister from '@/components/pwa/SWRegister'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import {
  DEFAULT_DESCRIPTION_HE,
  DEFAULT_TITLE_HE,
  SITE_URL,
} from '@/lib/site-config'
import './globals.css'

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE_HE, template: '%s | Fixly' },
  description: DEFAULT_DESCRIPTION_HE,
  applicationName: 'Fixly',
  keywords: [
    'Fixly',
    'תיקונים',
    'בעלי מקצוע',
    'אינסטלטור',
    'חשמלאי',
    'שיפוצים',
    'התאמת בעלי מקצוע',
    'ישראל',
  ],
  authors: [{ name: 'Fixly', url: SITE_URL }],
  creator: 'Fixly',
  publisher: 'Fixly',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fixly',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
    languages: { he: SITE_URL },
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: SITE_URL,
    siteName: 'Fixly',
    title: DEFAULT_TITLE_HE,
    description: DEFAULT_DESCRIPTION_HE,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE_HE,
    description: DEFAULT_DESCRIPTION_HE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: googleVerification
    ? { google: googleVerification }
    : undefined,
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fixly',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION_HE,
    logo: `${SITE_URL}/icons/icon-512.png`,
    areaServed: {
      '@type': 'Country',
      name: 'Israel',
    },
    potentialAction: {
      '@type': 'JoinAction',
      target: `${SITE_URL}/waitlist`,
      name: 'הרשמה מוקדמת ל-Fixly',
    },
  }

  return (
    <html lang="he" dir="rtl">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppProviders>
          <AppLayout>{children}</AppLayout>
        </AppProviders>
        <SWRegister />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
