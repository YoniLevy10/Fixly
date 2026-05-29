export type ProWaitlistEntry = {
  id: string
  fullName: string
  phone: string
  email?: string
  category?: string
  city?: string
  referralCode?: string
  createdAt: string
}

const entries: ProWaitlistEntry[] = []

export function addProWaitlistEntry(
  input: Omit<ProWaitlistEntry, 'id' | 'createdAt'>
): ProWaitlistEntry {
  const entry: ProWaitlistEntry = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  entries.push(entry)
  return entry
}

export function listProWaitlistEntries() {
  return [...entries]
}
