type ApiRequest = {
  id: string
  status: string
  [key: string]: unknown
}

async function fetchRequests(): Promise<ApiRequest[]> {
  const res = await fetch('/api/requests')
  if (!res.ok) return []
  const data = await res.json()
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

export const requestService = {
  async getAll() {
    return fetchRequests()
  },

  async getById(id: string) {
    const res = await fetch(`/api/requests/${id}`)
    if (!res.ok) return undefined
    return res.json()
  },

  async getActive() {
    const requests = await fetchRequests()
    return requests.filter((request) => request.status !== 'completed')
  },

  async getPending() {
    const requests = await fetchRequests()
    return requests.filter((request) => request.status === 'pending')
  },
}
