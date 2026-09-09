'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '@/components/ui/Card'

type WaitlistRow = {
  id: string
  full_name: string
  phone: string
  email?: string | null
  city: string | null
  category: string | null
  audience?: string | null
  source?: string | null
  referral_code?: string | null
  attribution?: Record<string, string> | null
  created_at: string
}

type BillingRow = {
  id: string
  event_type: string
  amount_agorot: number
  created_at: string
}

type AdminPayload = {
  via?: 'email' | 'password'
  storage?: 'supabase' | 'memory' | 'mixed'
  stats: {
    professionals: number
    requests: number
    pendingRequests: number
    completedRequests: number
    waitlist: number
    waitlistCustomers?: number
    waitlistProfessionals?: number
    reviews: number
    bamakorRequests?: number
    escalatedRequests?: number
    prospects?: number
    prospectsNew?: number
    prospectsContacted?: number
  }
  recentWaitlist: WaitlistRow[]
  recentBilling: BillingRow[]
}

type AudienceFilter = 'all' | 'customer' | 'professional'

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('0') ? `972${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}`
}

function utmLabel(attr?: Record<string, string> | null) {
  if (!attr) return null
  const parts = [attr.utm_source, attr.utm_medium, attr.utm_campaign].filter(
    Boolean
  )
  return parts.length ? parts.join(' / ') : null
}

export default function AdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordConfigured, setPasswordConfigured] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all')
  const [query, setQuery] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (res.status === 401 || res.status === 403) {
        setUnlocked(false)
        setPasswordConfigured(Boolean(body.passwordConfigured))
        setData(null)
        setError(
          typeof body.error === 'string' ? body.error : 'נדרשת התחברות מנהל'
        )
        return
      }
      if (!res.ok) {
        throw new Error(
          typeof body.error === 'string' ? body.error : 'טעינה נכשלה'
        )
      }
      setData(body as AdminPayload)
      setUnlocked(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/admin/unlock', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        setPasswordConfigured(Boolean(j.passwordConfigured))
        setUnlocked(Boolean(j.unlocked))
      })
      .catch(() => {})
      .finally(() => {
        void loadStats()
      })
  }, [loadStats])

  const onUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setUnlocking(true)
    setUnlockError(null)
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUnlockError(
          typeof body.error === 'string' ? body.error : 'סיסמה שגויה'
        )
        return
      }
      setPassword('')
      setUnlocked(true)
      await loadStats()
    } finally {
      setUnlocking(false)
    }
  }

  const onLock = async () => {
    await fetch('/api/admin/unlock', { method: 'DELETE' })
    setUnlocked(false)
    setData(null)
  }

  const filteredWaitlist = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.recentWaitlist.filter((row) => {
      if (audienceFilter !== 'all' && row.audience !== audienceFilter) {
        return false
      }
      if (!q) return true
      return [
        row.full_name,
        row.phone,
        row.email,
        row.city,
        row.category,
        row.source,
        row.referral_code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data, audienceFilter, query])

  const exportCsv = () => {
    if (!filteredWaitlist.length) return
    const header = [
      'created_at',
      'full_name',
      'phone',
      'email',
      'audience',
      'city',
      'category',
      'source',
      'referral_code',
      'utm',
    ]
    const lines = [
      header.join(','),
      ...filteredWaitlist.map((r) =>
        [
          r.created_at,
          r.full_name,
          r.phone,
          r.email ?? '',
          r.audience ?? '',
          r.city ?? '',
          r.category ?? '',
          r.source ?? '',
          r.referral_code ?? '',
          utmLabel(r.attribution) ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ]
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fixly-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!unlocked && !loading) {
    return (
      <main
        className="min-h-[70vh] flex items-center justify-center p-6 pb-28"
        dir="rtl"
      >
        <div className="w-full max-w-md">
          <Card>
            <div className="space-y-4 p-1">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fixly Ops</p>
                <h1 className="text-2xl font-black">מרכז תפעול</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {passwordConfigured
                    ? 'הזינו סיסמת מנהל כדי לפתוח את לוח הבקרה.'
                    : 'סיסמת מנהל עדיין לא הוגדרה (ADMIN_PAGE_PASSWORD). אפשר גם להתחבר עם מייל מ־ADMIN_EMAILS.'}
                </p>
              </div>

              {passwordConfigured ? (
                <form onSubmit={onUnlock} className="space-y-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="סיסמת מנהל"
                    className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
                    autoComplete="current-password"
                    required
                  />
                  {unlockError && (
                    <p className="text-sm text-red-600">{unlockError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={unlocking}
                    className="w-full rounded-xl bg-primary text-white py-2.5 font-bold disabled:opacity-60"
                  >
                    {unlocking ? 'בודק…' : 'כניסה'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  {error && <p className="text-sm text-amber-700">{error}</p>}
                  <button
                    type="button"
                    onClick={() => void loadStats()}
                    className="w-full rounded-xl border border-border py-2.5 font-bold"
                  >
                    נסה שוב עם חשבון ADMIN_EMAILS
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="p-6 pb-28" dir="rtl">
        <p className="text-muted-foreground">טוען מרכז תפעול…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="p-6 pb-28 space-y-4" dir="rtl">
        <h1 className="text-2xl font-bold">מרכז תפעול</h1>
        <p className="text-red-600">{error ?? 'אין נתונים'}</p>
        <button
          type="button"
          onClick={() => void loadStats()}
          className="rounded-xl bg-primary text-white px-4 py-2 font-bold"
        >
          נסה שוב
        </button>
      </main>
    )
  }

  const { stats, recentBilling } = data
  const cards = [
    {
      label: 'רשימת המתנה',
      value: stats.waitlist,
      hint: `${stats.waitlistCustomers ?? 0} לקוחות · ${stats.waitlistProfessionals ?? 0} מקצוענים`,
    },
    { label: 'בקשות ממתינות', value: stats.pendingRequests },
    { label: 'בקשות שהושלמו', value: stats.completedRequests },
    { label: 'בקשות סה״כ', value: stats.requests },
    { label: 'מקצוענים', value: stats.professionals },
    { label: 'ביקורות', value: stats.reviews },
    { label: 'באמקור', value: stats.bamakorRequests ?? 0 },
    { label: 'הסלמות', value: stats.escalatedRequests ?? 0 },
    {
      label: 'לידים לגיוס',
      value: stats.prospects ?? 0,
      hint: `${stats.prospectsNew ?? 0} חדשים · ${stats.prospectsContacted ?? 0} נוצר קשר`,
    },
  ]

  return (
    <main className="p-6 pb-28 space-y-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Fixly Admin</p>
          <h1 className="text-3xl font-black">מרכז תפעול</h1>
          <p className="text-xs text-muted-foreground mt-1">
            כניסה: {data.via === 'password' ? 'סיסמה' : 'מייל אדמין'}
            {data.storage && data.storage !== 'supabase'
              ? ` · אחסון: ${data.storage}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadStats()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
          >
            רענון
          </button>
          <a
            href="/superadmin"
            className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-bold"
          >
            Superadmin — גיוס
          </a>
          {passwordConfigured && (
            <button
              type="button"
              onClick={() => void onLock()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground"
            >
              נעילה
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
            <p className="text-3xl font-extrabold">{card.value}</p>
            {card.hint ? (
              <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
            ) : null}
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-lg">רשימת המתנה אחרונה</h2>
            <p className="text-xs text-muted-foreground">
              עד 50 רשומות — שם, טלפון, אימייל, מקור וזמן הרשמה
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-border px-3 py-1.5 text-sm font-bold"
          >
            ייצוא CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              ['all', 'הכל'],
              ['customer', 'לקוחות'],
              ['professional', 'מקצוענים'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAudienceFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                audienceFilter === key
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground/70'
              }`}
            >
              {label}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש שם / טלפון / עיר…"
            className="flex-1 min-w-[180px] rounded-lg border border-border px-3 py-1.5 text-sm"
          />
        </div>

        {filteredWaitlist.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין רשומות להצגה</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {filteredWaitlist.map((entry) => {
              const utm = utmLabel(entry.attribution)
              return (
                <li
                  key={entry.id}
                  className="border border-border rounded-xl p-3 space-y-1"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-base">{entry.full_name}</p>
                      <p className="text-muted-foreground">
                        {entry.audience === 'customer' ? 'לקוח' : 'מקצוען'}
                        {entry.city ? ` · ${entry.city}` : ''}
                        {entry.category ? ` · ${entry.category}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatWhen(entry.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <a
                      href={whatsappHref(entry.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary"
                    >
                      {entry.phone} · WhatsApp
                    </a>
                    {entry.email ? (
                      <a
                        href={`mailto:${entry.email}`}
                        className="text-muted-foreground"
                      >
                        {entry.email}
                      </a>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[
                      entry.source ? `מקור: ${entry.source}` : null,
                      entry.referral_code
                        ? `הפניה: ${entry.referral_code}`
                        : null,
                      utm ? `UTM: ${utm}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-bold text-lg mb-3">אירועי חיוב אחרונים</h2>
        {recentBilling.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין אירועי חיוב עדיין</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentBilling.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap justify-between gap-2 border-b border-border pb-2"
              >
                <span>
                  {event.event_type} —{' '}
                  <strong>{(event.amount_agorot / 100).toFixed(0)} ₪</strong>
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatWhen(event.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  )
}
