import { requests } from '@/lib/mock-data'

export const requestService = {
  getAll() {
    return requests
  },

  getById(id: string) {
    return requests.find((request) => request.id === id)
  },

  getActive() {
    return requests.filter((request) => request.status !== 'completed')
  },

  getPending() {
    return requests.filter((request) => request.status === 'pending')
  },
}
