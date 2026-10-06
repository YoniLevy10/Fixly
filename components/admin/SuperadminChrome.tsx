import Link from 'next/link'
import type { ReactNode } from 'react'

export default function SuperadminChrome({
  children,
  cta,
}: {
  children: ReactNode
  cta?: ReactNode
}) {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-[#10233f]" dir="rtl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-28 -top-16 h-72 w-72 rounded-full bg-secondary/40 blur-3xl" />
        <div className="absolute -left-36 top-[32rem] h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,53,99,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(18,53,99,0.035)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent_42%)]" />
      </div>

      <header className="sticky top-0 z-40 apple-glass pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Link href="/superadmin" className="flex min-w-0 items-center gap-2" aria-label="Fixly">
            <span dir="ltr" className="text-2xl font-black tracking-tight text-[#123563]">
              Fixly<span className="text-[#F59E0B]">.</span>
            </span>
            <span className="apple-glass-pill hidden rounded-full px-2.5 py-1 text-[11px] font-bold text-[#40546e] sm:inline-flex">
              סופר־אדמין
            </span>
          </Link>
          {cta}
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl space-y-5 px-5 py-6 pb-16 sm:px-8">{children}</div>
    </main>
  )
}
