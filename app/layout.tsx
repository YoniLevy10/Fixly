import type { Metadata, Viewport } from 'next'
import AppLayout from '@/components/layout/AppLayout'
import AppProviders from '@/components/providers/AppProviders'
import SWRegister from '@/components/pwa/SWRegister'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import MetaPixel from '@/components/analytics/MetaPixel'
import {
  DEFAULT_DESCRIPTION_HE,
  DEFAULT_TITLE_HE,
  SEO_KEYWORDS_HE,
  SITE_URL,
} from '@/lib/site-config'
import './globals.css'

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE_HE, template: '%s | Fixly' },
  description: DEFAULT_DESCRIPTION_HE,
  applicationName: 'Fixly',
  keywords: [...SEO_KEYWORDS_HE],
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
    <html lang="he" dir="rtl" className="fixly-booting">
      <body>
        {/* Static first-paint splash — Bamakor pattern; removed after AuthBootSplash. */}
        <div
          id="fixly-ssr-splash"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            backgroundColor: '#123563',
            color: '#fff',
            fontFamily: 'Heebo, system-ui, sans-serif',
          }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/fixly-icon.svg"
            alt=""
            width={96}
            height={96}
            style={{
              width: 96,
              height: 96,
              borderRadius: '1.75rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}
          />
          <div style={{ textAlign: 'center' }} dir="ltr">
            <p
              style={{
                margin: 0,
                fontSize: '1.875rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}
            >
              Fixly<span style={{ color: '#F59E0B' }}>.</span>
            </p>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
              }}
              dir="rtl"
            >
              תחזוקה חכמה
            </p>
          </div>
          <div
            style={{
              width: 176,
              height: 6,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '45%',
                height: '100%',
                borderRadius: 999,
                background: '#F59E0B',
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            טוען…
          </p>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppProviders>
          <AppLayout>{children}</AppLayout>
        </AppProviders>
        <SWRegister />
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  )
}
