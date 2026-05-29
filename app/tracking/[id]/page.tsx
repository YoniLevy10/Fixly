import TrackingScreen from '@/components/requests/TrackingScreen'

type TrackingPageProps = {
  params: Promise<{ id: string }>
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { id } = await params
  return <TrackingScreen requestId={id} />
}
