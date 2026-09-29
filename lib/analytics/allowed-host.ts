/**
 * Only measure production public traffic on fixly.tech.
 * Blocks localhost, loopback, and Vercel preview / alias hosts from GA/Meta.
 */
export function isAnalyticsHostAllowed(hostname?: string | null): boolean {
  if (typeof window === 'undefined' && !hostname) return false
  const host = (hostname ?? (typeof window !== 'undefined' ? window.location.hostname : ''))
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
  if (!host) return false
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false
  if (host.endsWith('.vercel.app')) return false
  return host === 'fixly.tech' || host === 'www.fixly.tech'
}
