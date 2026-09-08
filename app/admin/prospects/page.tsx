'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { PROSPECT_STATUSES, type ProspectStatus } from '@/lib/prospects/types'

type ProspectItem = {
  id: string
  name: string
  businessName: string | null
  phone: string | null
  whatsappPhone: string | null
  city: string
  categoryId: string | null
  categoryName: string | null
  categoryNameHe: string | null
  categorySlug: string | null
  sourceName: string
  sourceUrl: string | null
  status: ProspectStatus
  verificationStatus: string
  notes: string | null
  contactedAt: string | null
  createdAt: string
}

type ProspectEvent = {
  id: string
  action: string
  fromStatus: string | null
  toStatus: string | null
  createdAt: string
}

type Counters = {
  byStatus: Record<string, number>
  byCategory: Array<{ categoryId: string | null; name: string; count: number }>
  byCity: Array<{ city: string; count: number }>
  total: number
  verifiedTarget: {
    city: string
    perCategory: number
    categorySlugs: string[]
    verifiedCount: number
  }
}

type CategoryOption = {
  id: string
  slug: string | null
  name: string
  nameHe?: string | null
  name_he?: string | null
}

const STATUS_LABELS: Record<ProspectStatus, string> = {
  discovered: 'התגלה',
  verified: 'אומת',
  approved: 'אושר',
  contacted: 'נוצר קשר',
  interested: 'מעוניין',
  joined: 'הצטרף',
  active: 'פעיל',
  rejected: 'נדחה',
  do_not_contact: 'אין ליצור קשר',
}

export default function AdminProspectsPage() {
  const [items, setItems] = useState<ProspectItem[]>([])
  const [total, setTotal] = useState(0)
  const [counters, setCounters] = useState<Counters | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [city, setCity] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{
    prospect: ProspectItem
    events: ProspectEvent[]
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [csvText, setCsvText] = useState('')
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    city: 'ירושלים',
    categoryId: '',
    sourceUrl: '',
    notes: '',
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (status) params.set('status', status)
    if (categoryId) params.set('categoryId', categoryId)
    if (sourceName.trim()) params.set('sourceName', sourceName.trim())
    if (city.trim()) params.set('city', city.trim())
    return params.toString()
  }, [q, status, categoryId, sourceName, city])

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/prospects?${queryString}`)
      if (res.status === 403) throw new Error('אין הרשאת מנהל')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      setCounters(data.counters ?? null)
      setSelected(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינה')
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = data?.categories ?? data ?? []
        if (Array.isArray(list)) setCategories(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!detailId) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    fetch(`/api/admin/prospects/${detailId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then(setDetail)
      .catch((e) => setActionMsg(e instanceof Error ? e.message : 'שגיאה'))
      .finally(() => setDetailLoading(false))
  }, [detailId])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const patchStatus = async (id: string, nextStatus: ProspectStatus) => {
    setActionMsg(null)
    const res = await fetch(`/api/admin/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setActionMsg(data.error ?? 'עדכון נכשל')
      return
    }
    setActionMsg(`עודכן ל־${STATUS_LABELS[nextStatus]}`)
    await loadList()
    if (detailId === id) setDetailId(id)
  }

  const openWhatsApp = async (id: string) => {
    setActionMsg(null)
    const res = await fetch(`/api/admin/prospects/${id}/contact`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setActionMsg(data.error ?? 'לא ניתן לפתוח WhatsApp')
      return
    }
    window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer')
    setActionMsg('נפתח קישור WhatsApp (ידני)')
    await loadList()
    if (detailId === id) setDetailId(id)
  }

  const runBulk = async (nextStatus: ProspectStatus) => {
    if (selected.size === 0) return
    setActionMsg(null)
    const res = await fetch('/api/admin/prospects/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected], status: nextStatus }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setActionMsg(data.error ?? 'עדכון מרובה נכשל')
      return
    }
    setActionMsg(`עודכנו ${data.updated ?? 0} לידים`)
    await loadList()
  }

  const createManual = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setActionMsg(null)
    try {
      const res = await fetch('/api/admin/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newForm.name,
          businessName: newForm.businessName || null,
          phone: newForm.phone || null,
          city: newForm.city,
          categoryId: newForm.categoryId || null,
          sourceUrl: newForm.sourceUrl || null,
          notes: newForm.notes || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setActionMsg(data.error ?? 'יצירה נכשלה')
        return
      }
      setNewForm({
        name: '',
        businessName: '',
        phone: '',
        city: 'ירושלים',
        categoryId: '',
        sourceUrl: '',
        notes: '',
      })
      setActionMsg('ליד נוצר')
      await loadList()
    } finally {
      setCreating(false)
    }
  }

  const importCsv = async () => {
    setActionMsg(null)
    const res = await fetch('/api/admin/prospects/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: csvText }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setActionMsg(data.error ?? 'ייבוא נכשל')
      return
    }
    setActionMsg(
      `יובאו ${data.created ?? 0} · דולגו ${data.skipped?.length ?? 0} · שגיאות ${data.errors?.length ?? 0}`,
    )
    setCsvText('')
    await loadList()
  }

  const exportCsv = () => {
    window.open(`/api/admin/prospects/export?${queryString}`, '_blank')
  }

  const target = counters?.verifiedTarget

  return (
    <main className="p-4 md:p-6 pb-28 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
            ← חזרה ל־Operations
          </Link>
          <h1 className="text-3xl font-bold mt-1">גיוס אנשי מקצוע</h1>
          <p className="text-sm text-muted-foreground mt-1">
            לידים פוטנציאליים — לא נכנסים ל־professionals לפני הצטרפות
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          ייצוא CSV
        </button>
      </div>

      {actionMsg && (
        <p className="text-sm rounded-xl bg-amber-50 text-amber-900 px-3 py-2">{actionMsg}</p>
      )}

      {counters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <p className="text-sm text-muted-foreground">סה״כ לידים</p>
            <p className="text-2xl font-extrabold">{counters.total}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">
              יעד {target?.city} (מאומת+)
            </p>
            <p className="text-2xl font-extrabold">
              {target?.verifiedCount ?? 0}
              <span className="text-base font-medium text-muted-foreground">
                /{(target?.categorySlugs.length ?? 10) * (target?.perCategory ?? 10)}
              </span>
            </p>
          </Card>
          {PROSPECT_STATUSES.slice(0, 4).map((s) => (
            <Card key={s}>
              <p className="text-sm text-muted-foreground">{STATUS_LABELS[s]}</p>
              <p className="text-2xl font-extrabold">{counters.byStatus[s] ?? 0}</p>
            </Card>
          ))}
        </div>
      )}

      {counters && counters.byCategory.length > 0 && (
        <Card>
          <h2 className="font-bold mb-2">לפי קטגוריה</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {counters.byCategory.map((c) => (
              <span
                key={c.categoryId ?? c.name}
                className="rounded-full border px-3 py-1"
              >
                {c.name}: {c.count}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Label>חיפוש</Label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="שם / עסק / טלפון"
              className="mt-1"
            />
          </div>
          <div>
            <Label>סטטוס</Label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">הכל</option>
              {PROSPECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>קטגוריה</Label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">הכל</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameHe || c.name_he || c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>עיר</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="ירושלים"
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label>מקור</Label>
            <Input
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="manual / csv / …"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {selected.size > 0 && (
        <Card>
          <p className="text-sm mb-2">נבחרו {selected.size} — עדכון סטטוס מרובה (ללא WhatsApp)</p>
          <div className="flex flex-wrap gap-2">
            {(['verified', 'approved', 'rejected', 'do_not_contact'] as ProspectStatus[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => runBulk(s)}
                  className="rounded-xl border px-3 py-1.5 text-sm font-semibold"
                >
                  {STATUS_LABELS[s]}
                </button>
              ),
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">טוען לידים…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="אין לידים"
          description="הוסיפו ידנית או ייבאו CSV ממקור מורשה"
        />
      ) : (
        <Card>
          <p className="text-sm text-muted-foreground mb-3">
            מציג {items.length} מתוך {total}
          </p>
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex flex-wrap gap-3 items-start">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1"
                  aria-label={`בחר ${item.name}`}
                />
                <button
                  type="button"
                  className="flex-1 text-right"
                  onClick={() => setDetailId(item.id)}
                >
                  <div className="font-bold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.businessName ? `${item.businessName} · ` : ''}
                    {item.categoryNameHe || item.categoryName || '—'} · {item.city}
                  </div>
                  <div className="text-sm" dir="ltr">
                    {item.phone || item.whatsappPhone || 'ללא טלפון'}
                  </div>
                </button>
                <div className="text-sm font-semibold">{STATUS_LABELS[item.status]}</div>
                <div className="flex flex-wrap gap-1">
                  {item.status === 'discovered' && (
                    <button
                      type="button"
                      className="text-xs rounded-lg border px-2 py-1"
                      onClick={() => patchStatus(item.id, 'verified')}
                    >
                      אמת
                    </button>
                  )}
                  {(item.status === 'verified' || item.status === 'discovered') && (
                    <button
                      type="button"
                      className="text-xs rounded-lg border px-2 py-1"
                      onClick={() => patchStatus(item.id, 'approved')}
                    >
                      אשר
                    </button>
                  )}
                  {[
                    'approved',
                    'contacted',
                    'interested',
                    'joined',
                    'active',
                  ].includes(item.status) && (
                    <button
                      type="button"
                      className="text-xs rounded-lg bg-green-600 text-white px-2 py-1"
                      onClick={() => openWhatsApp(item.id)}
                    >
                      WhatsApp
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs rounded-lg border px-2 py-1"
                    onClick={() => patchStatus(item.id, 'rejected')}
                  >
                    דחה
                  </button>
                  <button
                    type="button"
                    className="text-xs rounded-lg border px-2 py-1"
                    onClick={() => patchStatus(item.id, 'do_not_contact')}
                  >
                    אל תיצור קשר
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detailId && (
        <Card>
          <div className="flex justify-between gap-2 mb-3">
            <h2 className="font-bold text-lg">פרטי ליד</h2>
            <button type="button" className="text-sm" onClick={() => setDetailId(null)}>
              סגור
            </button>
          </div>
          {detailLoading || !detail ? (
            <p className="text-muted-foreground">טוען…</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <strong>{detail.prospect.name}</strong>
                {detail.prospect.businessName
                  ? ` · ${detail.prospect.businessName}`
                  : ''}
              </p>
              <p>
                {detail.prospect.categoryNameHe || detail.prospect.categoryName} ·{' '}
                {detail.prospect.city} · {STATUS_LABELS[detail.prospect.status]}
              </p>
              <p dir="ltr">{detail.prospect.phone || detail.prospect.whatsappPhone}</p>
              {detail.prospect.sourceUrl && (
                <p>
                  מקור:{' '}
                  <a
                    href={detail.prospect.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline break-all"
                  >
                    {detail.prospect.sourceUrl}
                  </a>
                </p>
              )}
              {detail.prospect.notes && <p>הערות: {detail.prospect.notes}</p>}
              <div>
                <h3 className="font-semibold mb-1">היסטוריה</h3>
                {detail.events.length === 0 ? (
                  <p className="text-muted-foreground">אין אירועים</p>
                ) : (
                  <ul className="space-y-1">
                    {detail.events.map((ev) => (
                      <li key={ev.id} className="border-b border-border pb-1">
                        {ev.action}
                        {ev.fromStatus || ev.toStatus
                          ? ` · ${ev.fromStatus ?? '—'} → ${ev.toStatus ?? '—'}`
                          : ''}
                        <span className="text-muted-foreground">
                          {' '}
                          · {new Date(ev.createdAt).toLocaleString('he-IL')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-bold text-lg mb-3">הוספה ידנית</h2>
        <form onSubmit={createManual} className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>שם</Label>
            <Input
              required
              value={newForm.name}
              onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>עסק</Label>
            <Input
              value={newForm.businessName}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, businessName: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>טלפון</Label>
            <Input
              required
              dir="ltr"
              value={newForm.phone}
              onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>עיר</Label>
            <Input
              value={newForm.city}
              onChange={(e) => setNewForm((f) => ({ ...f, city: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>קטגוריה</Label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white"
              value={newForm.categoryId}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameHe || c.name_he || c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>קישור מקור</Label>
            <Input
              dir="ltr"
              value={newForm.sourceUrl}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, sourceUrl: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label>הערות</Label>
            <Input
              value={newForm.notes}
              onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="md:col-span-2 rounded-xl bg-primary text-white py-3 font-bold"
          >
            {creating ? 'שומר…' : 'צור ליד'}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="font-bold text-lg mb-2">ייבוא CSV ממקור מורשה</h2>
        <p className="text-sm text-muted-foreground mb-2">
          עמודות: name, business_name, phone, whatsapp_phone, city, category_slug,
          source_name, source_url, external_id, notes, verification_status
        </p>
        <textarea
          className="w-full min-h-[120px] rounded-xl border p-3 text-sm font-mono"
          dir="ltr"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="name,phone,city,category_slug,source_name&#10;יוסי,0501234567,ירושלים,plumbing,open_registry"
        />
        <button
          type="button"
          disabled={!csvText.trim()}
          onClick={importCsv}
          className="mt-3 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          ייבוא
        </button>
      </Card>
    </main>
  )
}
