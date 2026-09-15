import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
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

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  // Fewer weights = less render-blocking font CSS on mobile PageSpeed.
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-heebo',
  preload: true,
})

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

/** Reserve demo banner space from first paint when demo chrome is active (avoids CLS). */
const demoBannerReserve =
  process.env.NEXT_PUBLIC_FF_DEMO_KILL === 'true' ? '0px' : '40px'

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
    <html
      lang="he"
      dir="rtl"
      className={`fixly-booting ${heebo.variable}`}
      style={{ ['--fixly-demo-banner-h' as string]: demoBannerReserve }}
    >
      <body className={heebo.className}>
        {/* Critical first-paint CSS: navy boot, hide shell under splash, kill sidebar FOUC
            before Tailwind utilities apply (mobile CLS ~0.5 from bare <aside>). */}
        <style
          dangerouslySetInnerHTML={{
            __html: [
              'html.fixly-booting body{background-color:#123563;}',
              'html.fixly-booting .app-shell{visibility:hidden;}',
              '.fixly-app-splash{position:fixed;inset:0;z-index:100;background:#123563;}',
              '@media (max-width:1023px){',
              'aside.fixly-desktop-sidebar,header.fixly-desktop-header{display:none!important;}',
              '}',
            ].join(''),
          }}
        />
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
