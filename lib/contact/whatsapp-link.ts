import { formatPhoneDisplay } from '@/lib/i18n/format-locale'

/** Build wa.me link for Israeli numbers (972...) */
export function buildWhatsAppLink(
  phone: string,
  message: string,
): string | null {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  let normalized = digits
  if (normalized.startsWith('0')) {
    normalized = `972${normalized.slice(1)}`
  } else if (!normalized.startsWith('972')) {
    normalized = `972${normalized}`
  }

  const text = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${text}`
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
