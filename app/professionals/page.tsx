import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProfessionalsScreen from '@/components/professionals/ProfessionalsScreen'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'חיפוש אנשי מקצוע',
  description:
    'מצאו בעלי מקצוע מאומתים בישראל — אינסטלטור, חשמלאי, מיזוג ועוד. בקשה אחת ומעקב עד סיום עם Fixly.',
  alternates: { canonical: `${SITE_URL}/professionals` },
  openGraph: {
    title: 'חיפוש אנשי מקצוע | Fixly',
    description:
      'מצאו בעלי מקצוע מאומתים בישראל — אינסטלטור, חשמלאי, מיזוג ועוד.',
    url: `${SITE_URL}/professionals`,
    locale: 'he_IL',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function ProfessionalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ProfessionalsScreen />
    </Suspense>
  )
}
