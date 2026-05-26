import type { RequestStatus } from '@/types/request'

const progressOrder: RequestStatus[] = [
  'pending',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
]

export function getRequestProgress(status: RequestStatus) {
  return progressOrder.indexOf(status)
}
