import type { Metadata } from 'next'
import HomeScreen from '@/components/home/HomeScreen'
import PrelaunchLandingV2 from '@/components/marketing/PrelaunchLandingV2'
import { featureFlags } from '@/lib/feature-flags'
import {
  DEFAULT_DESCRIPTION_HE,
  DEFAULT_TITLE_HE,
  SITE_URL,
} from '@/lib/site-config'

export const metadata: Metadata = featureFlags.prelaunch
  ? {
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
  : {
      title: 'Fixly — תיקונים ואנשי מקצוע',
      description: DEFAULT_DESCRIPTION_HE,
    }

export default function HomePage() {
  if (featureFlags.prelaunch) {
    return <PrelaunchLandingV2 />
  }
  return <HomeScreen />
}
