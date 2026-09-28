'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, SendHorizontal, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { uploadChatImage } from '@/lib/storage/upload-chat-image'
import { cn } from '@/lib/utils/cn'

export type ChatMessage = {
  id: string
  body: string
  senderRole: 'customer' | 'professional' | 'system'
  createdAt: string
  imageUrl?: string | null
}

type RequestChatProps = {
  requestId: string
  enabled?: boolean
  /** Show locked state instead of hiding when chat not yet open */
  lockedHint?: string
  professionalName?: string
  className?: string
  /** Expand chat to fill remaining viewport on order hub */
  expanded?: boolean
}

function demoKey(requestId: string) {
  return `fixly-order-chat:${requestId}`
}

function loadDemoMessages(requestId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(demoKey(requestId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDemoMessages(requestId: string, messages: ChatMessage[]) {
  try {
    // Strip huge data-URLs from persistence to avoid quota errors
    const slim = messages.map((m) =>
      m.imageUrl && m.imageUrl.startsWith('data:') && m.imageUrl.length > 80_000
        ? { ...m, imageUrl: null, body: m.body || '📷 תמונה' }
        : m,
    )
    window.sessionStorage.setItem(demoKey(requestId), JSON.stringify(slim))
  } catch {
    /* quota */
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function RequestChat({
  requestId,
  enabled = true,
  lockedHint,
  professionalName,
  className,
  expanded = false,
}: RequestChatProps) {
  const { user } = useAuth()
  const { t } = useLocale()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demo] = useState(() => isDemoDataMode())
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const myRole = user.role === 'professional' ? 'professional' : 'customer'

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const seedWelcome = useCallback((): ChatMessage => {
    const name = professionalName?.trim() || t('chat.proFallback')
    return {
      id: `sys-welcome-${requestId}`,
      body: t('chat.welcome', { name }),
      senderRole: 'system',
      createdAt: new Date().toISOString(),
    }
  }, [professionalName, requestId, t])

  const load = useCallback(async () => {
    if (demo) {
      setMessages((prev) => {
        const local = loadDemoMessages(requestId)
        if (local.length > 0) return local
        if (prev.some((m) => m.senderRole === 'system')) return prev
        const welcome = [seedWelcome()]
        saveDemoMessages(requestId, welcome)
        return welcome
      })
      return
    }

    try {
      const res = await fetch(`/api/requests/${requestId}/messages`, {
        cache: 'no-store',
      })
      const data = res.ok ? await res.json() : []
      const list = Array.isArray(data) ? (data as ChatMessage[]) : []
      setMessages((prev) => {
        if (list.length > 0) return list
        if (prev.some((m) => m.id.startsWith('sys-welcome'))) return prev
        return [seedWelcome()]
      })
    } catch {
      setMessages((prev) =>
        prev.length > 0 ? prev : [seedWelcome()],
      )
    }
  }, [demo, requestId, seedWelcome])

  useEffect(() => {
    if (!enabled) return
    void load()
    if (demo) return
    const interval = window.setInterval(() => void load(), 6000)
    return () => window.clearInterval(interval)
  }, [enabled, load, demo])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview({ file, url: URL.createObjectURL(file) })
    setError(null)
  }

  const clearPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  const send = async () => {
    const body = text.trim()
    if ((!body && !preview) || sending) return
    setSending(true)
    setError(null)
    try {
      let imageUrl: string | null = null
      if (preview) {
        imageUrl = await uploadChatImage(preview.file)
        if (!imageUrl) {
          setError(t('chat.imageFailed'))
          return
        }
      }

      if (demo) {
        const mine: ChatMessage = {
          id: `c-${Date.now()}`,
          body: body || (imageUrl ? '' : ''),
          senderRole: 'customer',
          createdAt: new Date().toISOString(),
          imageUrl,
        }
        const next = [...messages, mine]
        const customerCount = next.filter((m) => m.senderRole === 'customer').length
        if (customerCount <= 2) {
          next.push({
            id: `p-${Date.now() + 1}`,
            body: imageUrl
              ? t('chat.demoReplyPhoto')
              : t('chat.demoReplyText'),
            senderRole: 'professional',
            createdAt: new Date(Date.now() + 700).toISOString(),
          })
        }
        setMessages(next)
        saveDemoMessages(requestId, next)
        setText('')
        clearPreview()
        return
      }

      const res = await fetch(`/api/requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          imageUrl: imageUrl && imageUrl.startsWith('http') ? imageUrl : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(
          typeof data.error === 'string' ? data.error : t('chat.sendFailed'),
        )
        return
      }
      const created = (await res.json()) as ChatMessage
      // If upload was data URL (shouldn't happen in live), keep preview url locally
      if (imageUrl && !created.imageUrl) {
        created.imageUrl = imageUrl
      }
      setMessages((prev) => [...prev, created])
      setText('')
      clearPreview()
    } finally {
      setSending(false)
    }
  }

  if (!enabled) {
    return (
      <div
        className={cn(
          'ios27-surface p-5 text-center animate-ios-fade',
          className,
        )}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Camera size={22} />
        </div>
        <p className="font-bold text-foreground">{t('chat.lockedTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {lockedHint ?? t('chat.lockedBody')}
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="request-chat"
      className={cn(
        'flex flex-col overflow-hidden rounded-[var(--radius-xl)] apple-glass-strong animate-ios-slide-up',
        expanded ? 'min-h-[22rem] flex-1' : 'min-h-[18rem]',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div>
          <h3 className="text-sm font-black text-foreground">{t('chat.title')}</h3>
          <p className="text-[11px] font-medium text-muted-foreground">
            {professionalName
              ? t('chat.withPro', { name: professionalName })
              : t('chat.secureHint')}
          </p>
        </div>
        <span className="apple-glass-pill rounded-full px-2.5 py-1 text-[10px] font-bold text-success">
          {t('chat.live')}
        </span>
      </div>

      <div
        className={cn(
          'flex-1 space-y-2.5 overflow-y-auto px-3 py-3',
          expanded ? 'max-h-[min(52vh,28rem)]' : 'max-h-56',
        )}
      >
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('chat.empty')}
          </p>
        )}
        {messages.map((m) => {
          if (m.senderRole === 'system') {
            return (
              <div key={m.id} className="flex justify-center px-4 py-1">
                <p className="apple-glass-pill max-w-[90%] rounded-full px-3 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
                  {m.body}
                </p>
              </div>
            )
          }
          const mine = m.senderRole === myRole
          return (
            <div
              key={m.id}
              className={cn('flex', mine ? 'justify-start' : 'justify-end')}
            >
              <div
                className={cn(
                  'max-w-[82%] overflow-hidden rounded-2xl px-3 py-2 text-sm shadow-sm',
                  mine
                    ? 'rounded-be-md bg-primary text-primary-foreground'
                    : 'rounded-bs-md bg-card text-foreground ring-1 ring-border/50',
                )}
              >
                {m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="mb-1.5 max-h-52 w-full rounded-xl object-cover"
                  />
                ) : null}
                {m.body && m.body !== '📷' ? (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {m.body}
                  </p>
                ) : null}
                <p
                  className={cn(
                    'mt-1 text-end text-[10px] tabular-nums',
                    mine ? 'text-white/70' : 'text-muted-foreground',
                  )}
                >
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 pb-1 text-center text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {preview && (
        <div className="relative mx-3 mb-2 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt=""
            className="h-28 w-full object-cover"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white"
            aria-label={t('chat.removePhoto')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="border-t border-border/40 px-2 py-2 safe-area-pb">
        <div className="flex items-end gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={onPickImage}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary transition-transform active:scale-95 disabled:opacity-40"
            aria-label={t('chat.attachPhoto')}
          >
            <ImagePlus size={22} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={t('chat.placeholder')}
            className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-[1.25rem] border-0 bg-white/80 px-3.5 py-2.5 text-sm outline-none ring-1 ring-border/40 focus:ring-primary/30"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <button
            type="button"
            disabled={sending || (!text.trim() && !preview)}
            onClick={() => void send()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95 disabled:opacity-40"
            aria-label={t('chat.send')}
          >
            <SendHorizontal size={18} className="rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  )
}
