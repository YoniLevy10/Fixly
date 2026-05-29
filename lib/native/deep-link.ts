import { routes } from '@/lib/routes'

/** Parse Fixly:// or https paths into app routes */
export function resolveDeepLink(url: string): string | null {
  try {
    const parsed = new URL(url.replace(/^fixly:\/\//i, 'https://fixly.app/'))
    const path = parsed.pathname
    if (path.startsWith('/tracking/')) return path
    if (path.startsWith('/request/')) return path
    if (path === '/pro/dashboard') return routes.proDashboard
    if (path === '/my-requests') return routes.myRequests
    return path || routes.home
  } catch {
    return null
  }
}

export function trackingDeepLink(requestId: string): string {
  return `fixly://tracking/${requestId}`
}
