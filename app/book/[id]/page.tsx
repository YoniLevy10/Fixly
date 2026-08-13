import Link from 'next/link'
import { notFound } from 'next/navigation'
import GlamBookForm from '@/components/glam/GlamBookForm'
import { getProfessional } from '@/lib/data/professionals-service'
import { routes } from '@/lib/routes'
import { ArrowRight } from 'lucide-react'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function BookPage({ params }: PageProps) {
  const { id } = await params
  const professional = await getProfessional(id)
  if (!professional) notFound()

  return (
    <div className="min-h-screen bg-background px-4 py-5 lg:px-8 lg:py-8 max-w-xl mx-auto">
      <Link
        href={routes.professional(id)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowRight size={16} />
        חזרה לפרופיל
      </Link>
      <h1 className="font-glam text-3xl text-foreground mb-1">הזמנה</h1>
      <p className="text-muted-foreground text-sm mb-6">
        בחרו שירות, מועד וכתובת — ותשלום ישירות באפליקציה.
      </p>
      <GlamBookForm professional={professional} />
    </div>
  )
}
