import { redirect } from 'next/navigation'

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/tracking/${id}`)
}
