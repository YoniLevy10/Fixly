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
    'הרשמה ל-Fixly',
    'בעל מקצוע עד הבית',
    'הזמנת בעל מקצוע',
    'תיקונים בבית',
    'פלטפורמה לבעלי מקצוע',
    'אינסטלטור',
    'חשמלאי',
  ],
  alternates: { canonical: `${SITE_URL}/waitlist` },
  openGraph: {
    title: WAITLIST_TITLE_HE,
    description: WAITLIST_DESCRIPTION_HE,
    url: `${SITE_URL}/waitlist`,
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
