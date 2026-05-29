import { notFound } from 'next/navigation'
import ProfessionalProfileView from '@/components/professionals/ProfessionalProfileView'
import { getProfessional } from '@/lib/data/professionals-service'

type ProfessionalPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProfessionalPage({ params }: ProfessionalPageProps) {
  const { id } = await params
  const pro = await getProfessional(id)

  if (!pro) {
    notFound()
  }

  return <ProfessionalProfileView pro={pro} />
}
