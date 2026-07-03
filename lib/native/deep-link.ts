import { routes } from '@/lib/routes'

/** Parse fixly://, com.fixly.app://, or https paths into app routes */
export function resolveDeepLink(url: string): string | null {
  try {
    const normalized = url
      .replace(/^fixly:\/\//i, 'https://fixly.app/')
      .replace(/^com\.fixly\.app:\/\//i, 'https://fixly.app/')
    const parsed = new URL(normalized)
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
