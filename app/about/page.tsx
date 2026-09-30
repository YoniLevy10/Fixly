import type { Metadata } from 'next'
import AboutContent from '@/components/about/AboutContent'
import {
  ABOUT_DESCRIPTION_HE,
  ABOUT_TITLE_HE,
  SITE_URL,
} from '@/lib/site-config'

export const metadata: Metadata = {
  title: { absolute: ABOUT_TITLE_HE },
  description: ABOUT_DESCRIPTION_HE,
  keywords: [
    'Fixly',
    'אודות Fixly',
    'בעל מקצוע עד הבית',
    'תיקונים בבית',
    'פלטפורמה לבעלי מקצוע',
    'הזמנת בעל מקצוע',
  ],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: ABOUT_TITLE_HE,
    description: ABOUT_DESCRIPTION_HE,
    url: `${SITE_URL}/about`,
    siteName: 'Fixly',
    locale: 'he_IL',
    type: 'website',
  },
}

export default function AboutPage() {
  const aboutLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: ABOUT_TITLE_HE,
    description: ABOUT_DESCRIPTION_HE,
    url: `${SITE_URL}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Fixly',
      url: SITE_URL,
      description: ABOUT_DESCRIPTION_HE,
      areaServed: { '@type': 'Country', name: 'Israel' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }}
      />
      <AboutContent />
    </>
  )
}
