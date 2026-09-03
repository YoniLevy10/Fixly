import type { Metadata } from 'next'
import { headers } from 'next/headers'
import HomeScreen from '@/components/home/HomeScreen'
import PrelaunchLanding from '@/components/marketing/PrelaunchLanding'
import {
  isProductHost,
  requestHostFromHeaders,
  shouldShowPrelaunchLanding,
} from '@/lib/site-hosts'
import {
  DEFAULT_DESCRIPTION_HE,
  DEFAULT_TITLE_HE,
  SITE_URL,
} from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const host = requestHostFromHeaders(await headers())
  if (shouldShowPrelaunchLanding(host)) {
    return {
      title: DEFAULT_TITLE_HE,
      description: DEFAULT_DESCRIPTION_HE,
      alternates: { canonical: SITE_URL },
      openGraph: {
        title: DEFAULT_TITLE_HE,
        description: DEFAULT_DESCRIPTION_HE,
        url: SITE_URL,
        siteName: 'Fixly',
        locale: 'he_IL',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: DEFAULT_TITLE_HE,
        description: DEFAULT_DESCRIPTION_HE,
      },
    }
  }

  return {
    title: 'Fixly — תיקונים ואנשי מקצוע',
    description: DEFAULT_DESCRIPTION_HE,
    // Keep organic SEO on fixly.tech during pre-launch; vercel.app is the product sandbox
    robots: isProductHost(host) ? { index: false, follow: true } : undefined,
  }
}

export default async function HomePage() {
  const host = requestHostFromHeaders(await headers())
  if (shouldShowPrelaunchLanding(host)) {
    return <PrelaunchLanding />
  }
  return <HomeScreen />
}
