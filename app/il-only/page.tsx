import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'זמין בישראל בלבד | Fixly',
  description: 'Fixly פועלת כרגע בישראל בלבד.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/il-only` },
}

export default function IsraelOnlyPage() {
  return (
    <main
      className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 text-center"
      dir="rtl"
    >
      <p className="text-sm font-semibold tracking-wide text-primary">Fixly</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
        השירות זמין בישראל בלבד
      </h1>
      <p className="mt-4 max-w-md text-base text-slate-600 leading-relaxed">
        Fixly מחברת לקוחות ובעלי מקצוע בישראל. אם אתם בישראל ועדיין רואים את
        המסך הזה — נסו רשת אחרת או VPN כבוי.
      </p>
      <p
        className="mt-6 max-w-md text-sm text-slate-500 leading-relaxed"
        lang="en"
        dir="ltr"
      >
        Fixly is currently available in Israel only.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
      >
        נסו שוב
      </Link>
    </main>
  )
}
