import type { Metadata } from 'next'
import PrelaunchLanding from '@/components/marketing/PrelaunchLanding'
import {
  DEFAULT_DESCRIPTION_HE,
  DEFAULT_TITLE_HE,
  SITE_URL,
} from '@/lib/site-config'

export const metadata: Metadata = {
  title: DEFAULT_TITLE_HE,
  description: DEFAULT_DESCRIPTION_HE,
  alternates: { canonical: `${SITE_URL}/waitlist` },
  openGraph: {
    title: DEFAULT_TITLE_HE,
    description: DEFAULT_DESCRIPTION_HE,
    url: `${SITE_URL}/waitlist`,
    siteName: 'Fixly',
    locale: 'he_IL',
    type: 'website',
  },
}

export default function WaitlistPage() {
  return <PrelaunchLanding />
}
