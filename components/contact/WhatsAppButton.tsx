'use client'

import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '@/lib/contact/whatsapp-link'
import { useLocale } from '@/lib/i18n/locale-provider'

type WhatsAppButtonProps = {
  phone: string
  message: string
  className?: string
  variant?: 'primary' | 'outline'
}

export default function WhatsAppButton({
  phone,
  message,
  className = '',
  variant = 'primary',
}: WhatsAppButtonProps) {
  const { t } = useLocale()
  const href = buildWhatsAppLink(phone, message)
  if (!href) return null

  const base =
    variant === 'primary'
      ? 'bg-[#25D366] text-white hover:opacity-90'
      : 'border-2 border-[#25D366] text-[#128C7E] bg-white hover:bg-green-50'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-opacity ${base} ${className}`}
    >
      <MessageCircle size={18} />
      {t('contact.whatsapp')}
    </a>
  )
}
