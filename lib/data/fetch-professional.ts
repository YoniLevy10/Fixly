import type { Professional } from '@/types/professional'

export async function fetchProfessional(
  id: string
): Promise<Professional | undefined> {
  const res = await fetch(`/api/professionals/${id}`)
  if (!res.ok) return undefined
  return res.json()
}
