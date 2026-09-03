import type { Metadata } from 'next'
import PrelaunchLanding from '@/components/marketing/PrelaunchLanding'
import { prelaunchCopy } from '@/lib/marketing/prelaunch-copy'
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
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: prelaunchCopy.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <PrelaunchLanding />
    </>
  )
}
