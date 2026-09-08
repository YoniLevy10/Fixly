export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Admin authorization — never trust user_metadata for privileged roles.
 * Prefer app_metadata.role (set only via service role / dashboard) or ADMIN_EMAILS.
 */
export function isAdminUser(user: {
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
} | null | undefined): boolean {
  if (!user) return false
  if (user.app_metadata?.role === 'admin') return true
  const email = user.email?.trim().toLowerCase()
  if (!email) return false
  return getAdminEmails().includes(email)
}
