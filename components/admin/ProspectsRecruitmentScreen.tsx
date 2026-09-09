'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { useAuth } from '@/lib/auth/auth-provider'
import { shouldKeepAsSoloProspect } from '@/lib/prospects/person-score'
import {
  contactabilityLabelHe,
  fitClassLabelHe,
} from '@/lib/prospects/fit-score'
import { humanizeDiscoveryErrors } from '@/lib/prospects/humanize-discovery-error'
import {
  FIT_CLASSES,
  PROSPECT_STATUSES,
  type Contactability,
  type FitClass,
  type ProspectStatus,
} from '@/lib/prospects/types'

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
  fitScore?: number | null
  fitClass?: FitClass | null
  fitConfidence?: number | null
  fitReasons?: string[] | null
  contactability?: Contactability | null
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
  byFitClass?: Record<string, number>
  needsReviewCount?: number
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

const RUN_STATUS_LABELS: Record<string, string> = {
  running: 'בתהליך',
  completed: 'הושלם',
  failed: 'נכשל',
}

type DiscoveryRunDetails = {
  bySource?: Record<
    string,
    {
      found?: number
      created?: number
      updated?: number
      skipped?: number
      errors?: string[]
      stats?: {
        rawFetched?: number
        uniquePlaces?: number
        rejectedNoPhone?: number
        rejectedFilter?: number
        kept?: number
        suitable?: number
        needsReview?: number
        searchCalls?: number
        stopReason?: string | null
      }
    }
  >
  deletedPrevious?: number
  budget?: number
  apiCallBudget?: number
  apiCalls?: number
  stopReason?: string | null
  updated?: number
  allErrors?: string[]
  replacePrevious?: boolean
}

type DiscoveryRun = {
  id: string
  trigger: string
  sources: string[] | null
  city: string
  status: string
  found_count: number
  created_count: number
  skipped_count: number
  error_count: number
  error_message: string | null
  details?: DiscoveryRunDetails | null
  started_at: string
  finished_at: string | null
}

function problemsForRun(run: DiscoveryRun): string[] {
  const raw: string[] = []
  if (Array.isArray(run.details?.allErrors)) {
    raw.push(...run.details!.allErrors!)
  }
  const bySource = run.details?.bySource
  if (bySource) {
    for (const src of Object.values(bySource)) {
      if (Array.isArray(src?.errors)) raw.push(...src.errors)
    }
  }
  if (run.error_message) raw.push(run.error_message)
  return humanizeDiscoveryErrors(raw)
}

function placesFunnelForRun(run: DiscoveryRun): {
  rawFetched: number
  uniquePlaces?: number
  rejectedNoPhone: number
  rejectedFilter: number
  kept: number
} | null {
  const stats = run.details?.bySource?.google_places?.stats
  if (!stats) return null
  return {
    rawFetched: stats.rawFetched ?? 0,
    uniquePlaces: stats.uniquePlaces,
    rejectedNoPhone: stats.rejectedNoPhone ?? 0,
    rejectedFilter: stats.rejectedFilter ?? 0,
    kept: stats.kept ?? 0,
  }
}

export default function ProspectsRecruitmentScreen() {
  const { user, isLoading: authLoading } = useAuth()
  const [items, setItems] = useState<ProspectItem[]>([])
  const [total, setTotal] = useState(0)
  const [counters, setCounters] = useState<Counters | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [fitClass, setFitClass] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [city, setCity] = useState('')
  const [replacePrevious, setReplacePrevious] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
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
  const [discovering, setDiscovering] = useState(false)
  const [discoveryPercent, setDiscoveryPercent] = useState(0)
  const [discoveryProgressLabel, setDiscoveryProgressLabel] = useState('')
  const [runs, setRuns] = useState<DiscoveryRun[]>([])
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
    if (fitClass) params.set('fitClass', fitClass)
    if (categoryId) params.set('categoryId', categoryId)
    if (sourceName.trim()) params.set('sourceName', sourceName.trim())
    if (city.trim()) params.set('city', city.trim())
    return params.toString()
  }, [q, status, fitClass, categoryId, sourceName, city])

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/prospects?${queryString}`)
      const data = await res.json().catch(() => ({}))
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'אין הרשאת מנהל — התחבר עם Google והוסף את המייל ל־ADMIN_EMAILS',
        )
      }
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'שגיאה בטעינה',
        )
      }
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

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prospects/discover')
      if (!res.ok) return
      const data = await res.json()
      setRuns(data.runs ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    loadRuns()
  }, [loadRuns])

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
    setActionMsg('נפתח קישור WhatsApp — עדיין לא סומן כ«נוצר קשר»')
    await loadList()
    if (detailId === id) setDetailId(id)
  }

  const confirmWhatsAppSent = async (id: string) => {
    setActionMsg(null)
    const res = await fetch(`/api/admin/prospects/${id}/contact/confirm`, {
      method: 'POST',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setActionMsg(data.error ?? 'אישור שליחה נכשל')
      return
    }
    setActionMsg('סומן שנשלחה הודעה (נוצר קשר)')
    await loadList()
    if (detailId === id) setDetailId(id)
  }

  const rejectWithReason = async (id: string) => {
    setActionMsg(null)
    const reason = rejectReason.trim() || 'נדחה ידנית'
    const res = await fetch(`/api/admin/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'rejected',
        notes: reason,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setActionMsg(data.error ?? 'דחייה נכשלה')
      return
    }
    setRejectReason('')
    setActionMsg('הליד נדחה')
    await loadList()
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

  const companyLikeOnPage = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status !== 'rejected' &&
          item.status !== 'do_not_contact' &&
          item.status !== 'joined' &&
          item.status !== 'active' &&
          !shouldKeepAsSoloProspect(item.name, item.businessName),
      ),
    [items],
  )

  const rejectCompanyLike = async () => {
    if (companyLikeOnPage.length === 0) {
      setActionMsg('אין ברשימה לידים שנראים כמו חברה')
      return
    }
    setActionMsg(null)
    const res = await fetch('/api/admin/prospects/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: companyLikeOnPage.map((p) => p.id),
        status: 'rejected',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setActionMsg(data.error ?? 'דחיית חברות נכשלה')
      return
    }
    setActionMsg(`נדחו ${data.updated ?? 0} לידים שנראים כמו חברה`)
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

  const runDiscovery = async () => {
    setDiscovering(true)
    setDiscoveryPercent(1)
    setDiscoveryProgressLabel('מתחיל גילוי…')
    setActionMsg(null)

    const poll = window.setInterval(async () => {
      try {
        const res = await fetch('/api/admin/prospects/discover')
        if (!res.ok) return
        const data = await res.json()
        const p = data.progress as
          | { percent?: number; labelHe?: string }
          | null
          | undefined
        if (p && typeof p.percent === 'number') {
          setDiscoveryPercent(Math.max(1, Math.min(99, Math.round(p.percent))))
          if (p.labelHe) setDiscoveryProgressLabel(p.labelHe)
        }
        if (Array.isArray(data.runs)) setRuns(data.runs)
      } catch {
        /* ignore poll errors */
      }
    }, 800)

    try {
      const res = await fetch('/api/admin/prospects/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replacePrevious }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && data.status !== 'completed') {
        setActionMsg(data.error ?? data.errorMessage ?? 'גילוי נכשל')
        return
      }
      setDiscoveryPercent(100)
      setDiscoveryProgressLabel('הגילוי הסתיים')
      setActionMsg(
        `גילוי מצטבר: חדשים ${data.created ?? 0} · עודכנו ${data.updated ?? 0} · דולגו ${data.skipped ?? 0} · קריאות API ${data.bySource?.google_places?.stats?.searchCalls ?? '—'} · תקציב קריאות ${data.apiCallBudget ?? '—'}`,
      )
      await Promise.all([loadList(), loadRuns()])
    } finally {
      window.clearInterval(poll)
      setDiscovering(false)
      setDiscoveryPercent(0)
      setDiscoveryProgressLabel('')
    }
  }

  const target = counters?.verifiedTarget
  const targetTotal =
    (target?.categorySlugs.length ?? 10) * (target?.perCategory ?? 10)

  return (
    <main
      className="p-3 sm:p-4 md:p-6 pb-28 space-y-5 max-w-6xl mx-auto overflow-x-hidden"
      dir="rtl"
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
            ← Operations
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Fixly Superadmin</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 break-words">
            גיוס אנשי מקצוע
          </h1>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            גילוי פרטיים + נייד · יעד {targetTotal} בירושלים
          </p>
          {!authLoading && (
            <p className="text-xs mt-2 break-all" dir="ltr">
              {user.isAnonymous || !user.email || user.email === 'אורח'
                ? 'לא מחובר עם Google — לך ל־/profile והתחבר'
                : `מחובר כ־${user.email}`}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
          <button
            type="button"
            onClick={runDiscovery}
            disabled={discovering}
            className="w-full rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-bold disabled:opacity-50 relative overflow-hidden"
            aria-live="polite"
          >
            {discovering ? (
              <span className="inline-flex items-center justify-center gap-2 w-full">
                <span>מריץ גילוי…</span>
                <span className="tabular-nums font-extrabold">{discoveryPercent}%</span>
              </span>
            ) : (
              'הרץ גילוי עכשיו'
            )}
            {discovering && (
              <span
                className="absolute inset-y-0 end-0 bg-white/20 transition-[width] duration-300"
                style={{ width: `${Math.max(4, discoveryPercent)}%` }}
                aria-hidden
              />
            )}
          </button>
          {discovering && discoveryProgressLabel ? (
            <p className="text-xs text-muted-foreground sm:col-span-3 -mt-1">
              {discoveryProgressLabel}
            </p>
          ) : null}
          <button
            type="button"
            onClick={exportCsv}
            className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            ייצוא CSV
          </button>
          <button
            type="button"
            onClick={rejectCompanyLike}
            disabled={companyLikeOnPage.length === 0}
            className="w-full rounded-xl border border-amber-600 text-amber-900 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
            title="דוחה לידים בעמוד הנוכחי שנראים כמו חברה ולא אדם פרטי"
          >
            דחה חברות ({companyLikeOnPage.length})
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="flex items-start gap-2 text-xs text-muted-foreground leading-snug">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={replacePrevious}
              onChange={(e) => setReplacePrevious(e.target.checked)}
            />
            מחיקת לידים אוטומטיים לפני גילוי (אופציונלי — ברירת מחדל מיזוג מצטבר)
          </label>
          <button
            type="button"
            onClick={() => setFitClass('needs_review')}
            className="rounded-xl border border-sky-600 text-sky-900 px-4 py-2 text-sm font-semibold whitespace-nowrap"
          >
            תור בדיקה (
            {counters?.needsReviewCount ??
              counters?.byFitClass?.needs_review ??
              0}
            )
          </button>
        </div>
      </div>

      {actionMsg && (
        <p className="text-sm rounded-xl bg-amber-50 text-amber-900 px-3 py-2 break-words">
          {actionMsg}
        </p>
      )}

      {runs.length > 0 && (
        <Card>
          <h2 className="font-bold mb-1">ריצות גילוי אחרונות</h2>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            גילוי מצטבר של מבצעי שירות אצל הלקוח (לא חנויות/רשתות). התאמה מקצועית
            נפרדת מיכולת יצירת קשר (נייד/קווי). פתיחת WhatsApp אינה נספרת כשליחה.
          </p>
          <ul className="space-y-3">
            {runs.slice(0, 2).map((run) => {
              const problems = problemsForRun(run)
              const funnel = placesFunnelForRun(run)
              const details = run.details
              const statusLabel = RUN_STATUS_LABELS[run.status] ?? run.status
              return (
                <li
                  key={run.id}
                  className="rounded-2xl border border-border/80 bg-slate-50/80 p-3 space-y-2 min-w-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-sm font-bold ${
                        run.status === 'failed'
                          ? 'text-red-700'
                          : run.status === 'running'
                            ? 'text-amber-700'
                            : 'text-emerald-800'
                      }`}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.started_at).toLocaleString('he-IL')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white px-2 py-2 border border-border/60">
                      <p className="text-[11px] text-muted-foreground">גולמי/נמצאו</p>
                      <p className="text-lg font-extrabold tabular-nums">
                        {run.found_count}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-2 py-2 border border-border/60">
                      <p className="text-[11px] text-muted-foreground">חדשים</p>
                      <p className="text-lg font-extrabold tabular-nums">
                        {run.created_count}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-2 py-2 border border-border/60">
                      <p className="text-[11px] text-muted-foreground">דולגו</p>
                      <p className="text-lg font-extrabold tabular-nums">
                        {run.skipped_count}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    עודכנו {typeof details?.updated === 'number' ? details.updated : '—'}
                    {' · '}
                    קריאות API{' '}
                    {typeof details?.apiCalls === 'number' ? details.apiCalls : '—'}
                    {' · '}
                    עצירה:{' '}
                    {details?.stopReason === 'api_call_budget'
                      ? 'תקציב קריאות API'
                      : details?.stopReason === 'raw_result_budget'
                        ? 'תקציב תוצאות'
                        : details?.stopReason === 'low_page_utility'
                          ? 'דף בלי תוצאות חדשות (שאילתה בודדת)'
                          : details?.stopReason ?? 'הושלם'}
                    {details?.budget != null ? ` · תקציב תוצאות ${details.budget}` : ''}
                  </p>
                  {funnel && funnel.rawFetched > 0 ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Places סרק {funnel.rawFetched} · ייחודיים {funnel.uniquePlaces ?? '—'} ·
                      נפסלו {funnel.rejectedFilter} · מתאימים/בדיקה {funnel.kept}
                    </p>
                  ) : null}
                  {problems.length > 0 ? (
                    <div className="space-y-1.5">
                      {problems.map((problem) => (
                        <p
                          key={problem}
                          className="text-sm text-amber-950 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 break-words"
                        >
                          {problem}
                        </p>
                      ))}
                    </div>
                  ) : run.status === 'completed' ? (
                    <p className="text-sm text-emerald-800">הריצה הסתיימה בהצלחה</p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {counters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <p className="text-sm text-muted-foreground">סה״כ לידים</p>
            <p className="text-2xl font-extrabold">{counters.total}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">
              עברו אימות ב{target?.city}
            </p>
            <p className="text-2xl font-extrabold">
              {target?.verifiedCount ?? 0}
              <span className="text-base font-medium text-muted-foreground">
                /{(target?.categorySlugs.length ?? 10) * (target?.perCategory ?? 10)}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              יעד גיוס אחרי אימות ידני — לא מספר כל הלידים שנמצאו
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
        <div className="grid md:grid-cols-6 gap-3">
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
            <Label>סטטוס גיוס</Label>
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
            <Label>התאמה</Label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white"
              value={fitClass}
              onChange={(e) => setFitClass(e.target.value)}
            >
              <option value="">הכל</option>
              {FIT_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {fitClassLabelHe(c)}
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
              placeholder="google_places / osm / manual"
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
              <li
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-start min-w-0"
              >
                <div className="flex gap-3 items-start min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 shrink-0"
                    aria-label={`בחר ${item.name}`}
                  />
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-right"
                    onClick={() => setDetailId(item.id)}
                  >
                    <div className="font-bold flex flex-wrap items-center gap-2">
                      <span className="break-words">{item.name}</span>
                      {item.fitClass && (
                        <span className="text-xs font-semibold rounded-md bg-sky-100 text-sky-900 px-2 py-0.5 shrink-0">
                          {fitClassLabelHe(item.fitClass)}
                          {typeof item.fitConfidence === 'number'
                            ? ` · ${item.fitConfidence}%`
                            : ''}
                        </span>
                      )}
                      {typeof item.fitScore === 'number' && (
                        <span className="text-xs font-semibold rounded-md bg-emerald-100 text-emerald-900 px-2 py-0.5 shrink-0">
                          ציון {item.fitScore}
                        </span>
                      )}
                      {item.contactability && (
                        <span className="text-xs font-semibold rounded-md bg-slate-100 text-slate-800 px-2 py-0.5 shrink-0">
                          קשר: {contactabilityLabelHe(item.contactability)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground break-words">
                      {item.businessName ? `${item.businessName} · ` : ''}
                      {item.categoryNameHe || item.categoryName || '—'} · {item.city}
                    </div>
                    {item.fitReasons && item.fitReasons.length > 0 && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 break-words">
                        {item.fitReasons.slice(0, 4).join(' · ')}
                      </div>
                    )}
                    <div className="text-sm break-all" dir="ltr">
                      {item.phone || item.whatsappPhone || 'ללא טלפון'}
                    </div>
                    <div className="text-sm font-semibold mt-1 sm:hidden">
                      {STATUS_LABELS[item.status]}
                    </div>
                  </button>
                  <div className="text-sm font-semibold hidden sm:block shrink-0">
                    {STATUS_LABELS[item.status]}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 items-center ps-7 sm:ps-0">
                  {(item.phone || item.whatsappPhone) &&
                    item.status !== 'rejected' &&
                    item.status !== 'do_not_contact' && (
                      <>
                        <button
                          type="button"
                          className="text-xs font-semibold rounded-lg bg-green-600 text-white px-3 py-1.5"
                          onClick={() => openWhatsApp(item.id)}
                          title="פותח קישור בלבד — לא מסמן נוצר קשר"
                        >
                          פתח WhatsApp
                        </button>
                        {item.status !== 'contacted' && (
                          <button
                            type="button"
                            className="text-xs font-semibold rounded-lg border border-green-700 text-green-800 px-2 py-1.5"
                            onClick={() => confirmWhatsAppSent(item.id)}
                          >
                            סימנתי שנשלח
                          </button>
                        )}
                      </>
                    )}
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
                  <button
                    type="button"
                    className="text-xs rounded-lg border px-2 py-1"
                    onClick={() => rejectWithReason(item.id)}
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
              <p>
                התאמה:{' '}
                {fitClassLabelHe(detail.prospect.fitClass)} · ביטחון{' '}
                {detail.prospect.fitConfidence ?? '—'}% · קשר:{' '}
                {contactabilityLabelHe(detail.prospect.contactability)}
              </p>
              {detail.prospect.fitReasons && detail.prospect.fitReasons.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  סיבות: {detail.prospect.fitReasons.join(' · ')}
                </p>
              )}
              <p dir="ltr">{detail.prospect.phone || detail.prospect.whatsappPhone}</p>
              {(detail.prospect.phone || detail.prospect.whatsappPhone) &&
                detail.prospect.status !== 'rejected' &&
                detail.prospect.status !== 'do_not_contact' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold"
                      onClick={() => openWhatsApp(detail.prospect.id)}
                    >
                      פתח WhatsApp
                    </button>
                    {detail.prospect.status !== 'contacted' && (
                      <button
                        type="button"
                        className="rounded-lg border border-green-700 text-green-800 px-4 py-2 text-sm font-semibold"
                        onClick={() => confirmWhatsAppSent(detail.prospect.id)}
                      >
                        סימנתי שנשלח
                      </button>
                    )}
                  </div>
                )}
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[12rem]">
                  <Label>סיבת דחייה</Label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="למשל: חנות חומרים / לא מבצע שירות"
                    className="mt-1"
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg border px-4 py-2 text-sm"
                  onClick={() => rejectWithReason(detail.prospect.id)}
                >
                  דחה עם סיבה
                </button>
              </div>
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
