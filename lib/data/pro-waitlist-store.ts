export type WaitlistAudience = 'customer' | 'professional'

export type ProWaitlistEntry = {
  id: string
  fullName: string
  phone: string
  email?: string
  category?: string
  city?: string
  referralCode?: string
  audience: WaitlistAudience
  source?: string
  createdAt: string
}

const entries: ProWaitlistEntry[] = []

export function addProWaitlistEntry(
  input: Omit<ProWaitlistEntry, 'id' | 'createdAt' | 'audience'> & {
    audience?: WaitlistAudience
  }
): ProWaitlistEntry {
  const entry: ProWaitlistEntry = {
    ...input,
    audience: input.audience ?? 'professional',
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  entries.push(entry)
  return entry
}

export function listProWaitlistEntries() {
  return [...entries]
}
