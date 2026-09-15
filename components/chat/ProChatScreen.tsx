'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, SendHorizontal } from 'lucide-react'
import { routes } from '@/lib/routes'
import { useLocale } from '@/lib/i18n/locale-provider'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { cn } from '@/lib/utils/cn'

type ChatMessage = {
  id: string
  body: string
  senderRole: 'customer' | 'professional'
  createdAt: string
}

type ProInfo = {
  id: string
  name: string
  title: string | null
  avatarUrl: string | null
}

type ProChatScreenProps = {
  professionalId: string
}

function demoStorageKey(professionalId: string) {
  return `fixly-demo-chat:${professionalId}`
}

function loadDemoMessages(professionalId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(demoStorageKey(professionalId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDemoMessages(professionalId: string, messages: ChatMessage[]) {
  try {
    window.localStorage.setItem(
      demoStorageKey(professionalId),
      JSON.stringify(messages),
    )
  } catch {
    /* ignore quota */
  }
}

export default function ProChatScreen({ professionalId }: ProChatScreenProps) {
  const { t } = useLocale()
  const [pro, setPro] = useState<ProInfo | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [demo, setDemo] = useState(isDemoDataMode())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setBooting(true)
      setError(null)
      try {
        const res = await fetch('/api/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ professionalId }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (!cancelled) {
            setError(
              typeof data.error === 'string'
                ? data.error
                : 'לא ניתן לפתוח שיחה',
            )
          }
          return
        }
        if (cancelled) return
        setRequestId(data.requestId as string)
        setPro(data.professional as ProInfo)
        setDemo(Boolean(data.demo))
        if (data.demo) {
          let local = loadDemoMessages(professionalId)
          if (local.length === 0) {
            const opener: ChatMessage = {
              id: 'welcome',
              body: `שלום ${data.professional?.name ?? ''}, יש לי תקלה בבית ואשמח לעזרה.`.trim(),
              senderRole: 'customer',
              createdAt: new Date().toISOString(),
            }
            const reply: ChatMessage = {
              id: 'welcome-reply',
              body: 'היי! קיבלתי, אפשר לפרט מה קרה ואחזור אליך מיד.',
              senderRole: 'professional',
              createdAt: new Date(Date.now() + 1000).toISOString(),
            }
            local = [opener, reply]
            saveDemoMessages(professionalId, local)
          }
          setMessages(local)
        }
      } catch {
        if (!cancelled) setError('לא ניתן לפתוח שיחה')
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [professionalId])

  const loadLive = useCallback(async () => {
    if (!requestId || demo) return
    const res = await fetch(`/api/requests/${requestId}/messages`)
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) setMessages(data)
  }, [requestId, demo])

  useEffect(() => {
    if (!requestId || demo) return
    void loadLive()
    const id = window.setInterval(() => void loadLive(), 6000)
    return () => window.clearInterval(id)
  }, [requestId, demo, loadLive])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      if (demo) {
        const mine: ChatMessage = {
          id: `c-${Date.now()}`,
          body,
          senderRole: 'customer',
          createdAt: new Date().toISOString(),
        }
        const next = [...messages, mine]
        // Light auto-reply so the demo feels alive
        if (next.filter((m) => m.senderRole === 'customer').length <= 3) {
          next.push({
            id: `p-${Date.now() + 1}`,
            body: 'מעולה, קיבלתי. אעדכן זמינות ואחזור אליך.',
            senderRole: 'professional',
            createdAt: new Date(Date.now() + 800).toISOString(),
          })
        }
        setMessages(next)
        saveDemoMessages(professionalId, next)
        setText('')
        return
      }
      if (!requestId) return
      const res = await fetch(`/api/requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        setText('')
        await loadLive()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(typeof data.error === 'string' ? data.error : 'שליחה נכשלה')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--fixly-demo-banner-h,0px))] max-w-lg mx-auto bg-[#e5ddd5]">
      <header className="shrink-0 flex items-center gap-3 px-3 py-2.5 bg-primary text-white shadow-sm">
        <Link
          href={routes.professionals}
          className="p-1.5 rounded-full hover:bg-white/10"
          aria-label="חזרה"
        >
          <ArrowRight size={20} />
        </Link>
        <div
          className="w-9 h-9 rounded-full bg-white/20 bg-cover bg-center flex items-center justify-center text-sm font-bold"
          style={{
            backgroundImage: pro?.avatarUrl
              ? `url(${pro.avatarUrl})`
              : undefined,
          }}
        >
          {!pro?.avatarUrl && (pro?.name?.charAt(0) ?? '?')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate">
            {pro?.name ?? (booting ? '…' : 'איש מקצוע')}
          </p>
          {pro?.title && (
            <p className="text-[11px] text-white/80 truncate">{pro.title}</p>
          )}
        </div>
        {requestId && !demo && (
          <Link
            href={routes.tracking(requestId)}
            className="text-[11px] underline underline-offset-2 shrink-0"
          >
            מעקב
          </Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {booting && (
          <p className="text-center text-sm text-gray-600 py-8">פותח שיחה…</p>
        )}
        {error && (
          <p className="text-center text-sm text-red-700 bg-white/80 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        {!booting && messages.length === 0 && !error && (
          <p className="text-center text-sm text-gray-600 py-8">
            {t('chat.empty')}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderRole === 'customer'
          return (
            <div
              key={m.id}
              className={cn('flex', mine ? 'justify-start' : 'justify-end')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                  mine
                    ? 'bg-[#dcf8c6] text-gray-900 rounded-br-md'
                    : 'bg-white text-gray-900 rounded-bl-md',
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className="text-[10px] text-gray-500 mt-1 text-end tabular-nums">
                  {new Date(m.createdAt).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-black/5 bg-[#f0f0f0] px-2 py-2 safe-area-pb">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={t('chat.placeholder')}
            className="flex-1 resize-none rounded-2xl border-0 bg-white px-3 py-2.5 text-sm max-h-28 outline-none shadow-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <button
            type="button"
            disabled={!text.trim() || sending || booting}
            onClick={() => void send()}
            className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 shadow-sm"
            aria-label={t('chat.send')}
          >
            <SendHorizontal size={18} className="rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  )
}
