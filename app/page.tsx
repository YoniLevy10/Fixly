import type { Metadata } from 'next'
import { headers } from 'next/headers'
import HomeScreen from '@/components/home/HomeScreen'
import PrelaunchLanding from '@/components/marketing/PrelaunchLanding'
import {
  isIndexablePublicHost,
  requestHostFromHeaders,
  shouldShowPrelaunchLanding,
} from '@/lib/site-hosts'
import {
  DEFAULT_DESCRIPTION_HE,
  DEFAULT_TITLE_HE,
  WAITLIST_DESCRIPTION_HE,
  WAITLIST_TITLE_HE,
  SITE_URL,
} from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const host = requestHostFromHeaders(await headers())
  if (shouldShowPrelaunchLanding(host)) {
    return {
      title: WAITLIST_TITLE_HE,
      description: WAITLIST_DESCRIPTION_HE,
      alternates: { canonical: SITE_URL },
      openGraph: {
        title: WAITLIST_TITLE_HE,
        description: WAITLIST_DESCRIPTION_HE,
        url: SITE_URL,
        siteName: 'Fixly',
        locale: 'he_IL',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: WAITLIST_TITLE_HE,
        description: WAITLIST_DESCRIPTION_HE,
      },
    }
  }

  return {
    title: DEFAULT_TITLE_HE,
    description: DEFAULT_DESCRIPTION_HE,
    robots: isIndexablePublicHost(host)
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: DEFAULT_TITLE_HE,
      description: DEFAULT_DESCRIPTION_HE,
      url: SITE_URL,
      siteName: 'Fixly',
      locale: 'he_IL',
      type: 'website',
    },
  }
}

export default async function HomePage() {
  const host = requestHostFromHeaders(await headers())
  if (shouldShowPrelaunchLanding(host)) {
    return <PrelaunchLanding />
  }
  return <HomeScreen />
}
