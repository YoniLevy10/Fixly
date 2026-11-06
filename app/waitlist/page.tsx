import type { Metadata } from 'next'
import PrelaunchLanding from '@/components/marketing/PrelaunchLanding'
import { prelaunchCopy } from '@/lib/marketing/prelaunch-copy'
import {
  SITE_URL,
  WAITLIST_DESCRIPTION_HE,
  WAITLIST_TITLE_HE,
} from '@/lib/site-config'

export const metadata: Metadata = {
  title: { absolute: WAITLIST_TITLE_HE },
  description: WAITLIST_DESCRIPTION_HE,
  keywords: [
    'Fixly',
    'הרשמה לבעלי מקצוע',
    'עבודות לבעלי מקצוע',
    'לידים לאינסטלטור',
    'לידים לחשמלאי',
  ],
  alternates: { canonical: SITE_URL },
  robots: { index: false, follow: true },
  openGraph: {
    title: WAITLIST_TITLE_HE,
    description: WAITLIST_DESCRIPTION_HE,
    url: SITE_URL,
    siteName: 'Fixly',
    locale: 'he_IL',
    type: 'website',
  },
}

export default async function WaitlistPage() {
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
      <PrelaunchLanding initialAudience="professional" />
    </>
  )
}
