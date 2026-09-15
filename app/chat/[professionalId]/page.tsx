import ProChatScreen from '@/components/chat/ProChatScreen'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ professionalId: string }>
}) {
  const { professionalId } = await params
  return <ProChatScreen professionalId={professionalId} />
}
