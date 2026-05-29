const DRAFT_KEY = 'fixly-request-draft'

export type RequestDraft = {
  title: string
  description: string
  preferredDate: string
  preferredTime: string
  location: string
  customerPhone: string
  professionalId?: string
  savedAt: string
}

export function loadRequestDraft(): RequestDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RequestDraft
  } catch {
    return null
  }
}

export function saveRequestDraft(draft: Omit<RequestDraft, 'savedAt'>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ ...draft, savedAt: new Date().toISOString() })
  )
}

export function clearRequestDraft() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DRAFT_KEY)
}
