import { formatPhoneDisplay } from '@/lib/i18n/format-locale'
import { normalizePhone } from '@/lib/prospects/phone'

/** Build wa.me link for Israeli numbers (972...) */
export function buildWhatsAppLink(
  phone: string,
  message: string,
): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized) {
    // Last-resort: strip non-digits (legacy callers)
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) return null
    let fallback = digits
    if (fallback.startsWith('0')) fallback = `972${fallback.slice(1)}`
    else if (!fallback.startsWith('972')) fallback = `972${fallback}`
    const text = encodeURIComponent(message)
    return `https://wa.me/${fallback}?text=${text}`
  }

  const text = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${text}`
}

export function isAppleMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS desktop UA
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/**
 * Open WhatsApp (or any external URL) from a user gesture.
 * Prefer a synchronous `window.open(url)` when the URL is already known.
 * After `await`, iOS Safari blocks new popups — use same-tab assign on iOS,
 * and never trust a blank `about:blank` tab (often stays empty on iPhone).
 */
export function openExternalUrl(url: string): void {
  if (typeof window === 'undefined' || !url) return
  if (isAppleMobileBrowser()) {
    window.location.assign(url)
    return
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.location.assign(url)
  }
}

/**
 * Open an external URL after an async click handler.
 * iOS Safari blocks `window.open` after `await` — prefer same-tab handoff
 * (especially for wa.me → WhatsApp app). Blank pre-opened tabs are unreliable
 * on iPhone and are closed rather than navigated.
 */
export function navigateAfterAsyncClick(
  url: string,
  preOpened: Window | null,
): void {
  if (typeof window === 'undefined' || !url) return

  if (isAppleMobileBrowser()) {
    try {
      preOpened?.close()
    } catch {
      /* ignore */
    }
    window.location.assign(url)
    return
  }

  if (preOpened && !preOpened.closed) {
    try {
      preOpened.location.href = url
      return
    } catch {
      try {
        preOpened.close()
      } catch {
        /* ignore */
      }
    }
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.location.assign(url)
  }
}

export function buildRequestWhatsAppMessage(input: {
  proName: string
  customerName: string
  description: string
  location?: string
  trackingUrl: string
  locale?: string
}): string {
  const isHe = (input.locale ?? 'he') !== 'en'
  if (isHe) {
    return [
      `שלום ${input.proName},`,
      `שמי ${input.customerName} — שלחתי בקשה דרך Fixly.`,
      input.location ? `📍 ${input.location}` : '',
      `📝 ${input.description}`,
      `🔗 מעקב: ${input.trackingUrl}`,
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    `Hi ${input.proName},`,
    `${input.customerName} here — I sent a request via Fixly.`,
    input.location ? `📍 ${input.location}` : '',
    `📝 ${input.description}`,
    `🔗 Track: ${input.trackingUrl}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatWhatsAppPhoneDisplay(phone: string): string {
  return formatPhoneDisplay(phone)
}
