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

/**
 * Open an external URL after an async click handler.
 * iOS Safari blocks `window.open` after `await` — pass a window opened
 * synchronously in the click handler, or fall back to same-tab navigation
 * (works well for wa.me → WhatsApp app).
 */
export function navigateAfterAsyncClick(
  url: string,
  preOpened: Window | null,
): void {
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
  window.location.assign(url)
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
