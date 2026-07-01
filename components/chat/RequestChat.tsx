'use client'

import { useCallback, useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'

type ChatMessage = {
  id: string
  body: string
  senderRole: 'customer' | 'professional'
  createdAt: string
}

type RequestChatProps = {
  requestId: string
  enabled?: boolean
}

export default function RequestChat({ requestId, enabled = true }: RequestChatProps) {
  const { user } = useAuth()
  const { t } = useLocale()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/requests/${requestId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .catch(() => setMessages([]))
  }, [requestId])

  useEffect(() => {
    if (!enabled) return
    load()
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [enabled, load])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        setText('')
        load()
      }
    } finally {
      setSending(false)
    }
  }

  if (!enabled) return null

  const myRole = user.role === 'professional' ? 'professional' : 'customer'

  return (
    <div className="bg-card rounded-2xl border-2 border-border p-4 mt-4">
      <h3 className="font-bold mb-3">{t('chat.title')}</h3>
      <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('chat.empty')}</p>
        )}
        {messages.map((m) => {
          const mine = m.senderRole === myRole
          return (
            <div
              key={m.id}
              className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                mine
                  ? 'bg-primary text-white ms-auto'
                  : 'bg-muted text-foreground'
              }`}
            >
              {m.body}
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('chat.placeholder')}
          className="flex-1 border border-border rounded-xl px-3 py-2 text-sm"
          maxLength={2000}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-primary text-white p-2.5 rounded-xl disabled:opacity-50"
          aria-label={t('chat.send')}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
