'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/shared/BackButton'
import { routes } from '@/lib/routes'

type LegalPageLayoutProps = {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
      <div className="flex items-center gap-3 mb-6">
        <BackButton onClick={() => router.back()} />
        <h1 className="text-xl font-black lg:text-2xl">{title}</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">{lastUpdated}</p>
      <article className="prose-legal space-y-4 text-sm text-foreground leading-relaxed">
        {children}
      </article>
      <p className="mt-10 text-center">
        <Link href={routes.home} className="text-primary font-medium text-sm">
          Fixly
        </Link>
      </p>
    </div>
  )
}
