export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminUser(user: {
  email?: string | null
  user_metadata?: Record<string, unknown>
} | null | undefined): boolean {
  if (!user) return false
  if (user.user_metadata?.role === 'admin') return true
  const email = user.email?.trim().toLowerCase()
  if (!email) return false
  return getAdminEmails().includes(email)
}
