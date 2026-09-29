import type { Metadata } from 'next'
import PrelaunchLanding from '@/components/marketing/PrelaunchLanding'
import { prelaunchCopy } from '@/lib/marketing/prelaunch-copy'
import type { WaitlistAudience } from '@/lib/data/pro-waitlist-store'
import { SITE_URL } from '@/lib/site-config'

const WAITLIST_DESCRIPTION =
  'הרשמה אחת ל-Fixly — ללקוחות ולבעלי מקצוע. שם וטלפון בלבד, שמירה מאובטחת, ועדכון כשהאזור נפתח.'

export const metadata: Metadata = {
  title: 'הרשמה | Fixly',
  description: WAITLIST_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/waitlist` },
  openGraph: {
    title: 'הרשמה | Fixly — לקוחות ובעלי מקצוע',
    description: WAITLIST_DESCRIPTION,
    url: `${SITE_URL}/waitlist`,
    siteName: 'Fixly',
    locale: 'he_IL',
    type: 'website',
  },
}

type PageProps = {
  searchParams: Promise<{ audience?: string }>
}

export default async function WaitlistPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const initialAudience: WaitlistAudience =
    sp.audience === 'professional' ? 'professional' : 'customer'

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
      <PrelaunchLanding initialAudience={initialAudience} />
    </>
  )
}
