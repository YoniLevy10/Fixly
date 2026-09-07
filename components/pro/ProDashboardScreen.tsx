'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
} from 'lucide-react'
import RequestStatusBadge from '@/components/shared/RequestStatusBadge'
import Textarea from '@/components/ui/Textarea'
import { useAuth, DEMO_PROFESSIONAL_ID } from '@/lib/auth/auth-provider'
import { formatDate } from '@/lib/i18n/format-date'
import { useLocale } from '@/lib/i18n/locale-provider'
import {
  updateRequestStatusApi,
  useRequestsList,
} from '@/shared/hooks/use-requests-api'
import PullToRefreshIndicator from '@/components/shared/PullToRefreshIndicator'
import { featureFlags } from '@/lib/feature-flags'
import { agorotToIls } from '@/lib/monetization/config'
import { track } from '@/lib/analytics/track'
import { useRequestsListRealtime } from '@/shared/hooks/use-request-realtime'
import { usePullToRefresh } from '@/shared/hooks/use-pull-to-refresh'
import type { MockRequest } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'
import { ACTIVE_REQUEST_STATUSES } from '@/shared/constants/request-status'
import { cn } from '@/lib/utils/cn'
import { isTrackingStatus } from '@/lib/tracking/geo'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import {
  DEMO_TOUR_EVENT,
  readTourRequest,
} from '@/lib/demo/tour-session'
import Link from 'next/link'
import { routes } from '@/lib/routes'
import ProLocationSharing from '@/components/pro/ProLocationSharing'
import ProAvailabilityEditor from '@/components/pro/ProAvailabilityEditor'

const TEMPLATES = [
  'improvements.templateApprove',
  'improvements.templateDecline',
  'improvements.templateThanks',
] as const

type TabKey = 'pending' | 'active' | 'done' | 'stats'

export default function ProDashboardScreen() {
  const { user, claimProfessionalProfile } = useAuth()
  const { locale, t } = useLocale()
  const { requests: apiRequests, loading, refresh } = useRequestsList({
    scope: user.role === 'professional' ? 'pro' : undefined,
  })

  // Merge investor-tour snapshot so the pro dashboard isn't empty across Vercel isolates
  const [tourRequest, setTourRequest] = useState<MockRequest | null>(null)
  useEffect(() => {
    if (!isDemoDataMode()) return
    const sync = () => setTourRequest(readTourRequest())
    sync()
    const onTour = (event: Event) => {
      setTourRequest((event as CustomEvent<MockRequest>).detail ?? null)
    }
    window.addEventListener(DEMO_TOUR_EVENT, onTour)
    const poll = window.setInterval(sync, 1000)
    return () => {
      window.removeEventListener(DEMO_TOUR_EVENT, onTour)
      window.clearInterval(poll)
    }
  }, [])

  const requests = useMemo(() => {
    if (!tourRequest) return apiRequests
    const others = apiRequests.filter((r) => r.id !== tourRequest.id)
    return [tourRequest, ...others]
  }, [apiRequests, tourRequest])

  useRequestsListRealtime(refresh, {
    professionalId: user.professionalId,
    enabled: user.role === 'professional',
  })
  const pull = usePullToRefresh(refresh)
  const [selectedRequest, setSelectedRequest] = useState<MockRequest | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('pending')

  // Auto-focus the live tour job so investors see accept / status advances
  useEffect(() => {
    if (!tourRequest) return
    setSelectedRequest(tourRequest)
    if (tourRequest.status === 'pending') setActiveTab('pending')
    else if (
      tourRequest.status === 'accepted' ||
      tourRequest.status === 'on_the_way' ||
      tourRequest.status === 'in_progress'
    ) {
      setActiveTab('active')
    } else if (tourRequest.status === 'completed') {
      setActiveTab('done')
    }
  }, [tourRequest])
  const [proBilling, setProBilling] = useState<{
    subscription_tier: string
    lead_credits: number
    subscription_until: string | null
    stripe_customer_id: string | null
  } | null>(null)

  useEffect(() => {
    if (user.role !== 'professional') return
    let cancelled = false
    fetch('/api/pro/billing-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setProBilling(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user.role])

  const openBillingPortal = async () => {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.url) {
      alert(data.error ?? 'שגיאה בפתיחת פורטל החיוב')
      return
    }
    window.location.href = data.url
  }

  const stats = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === 'pending').length,
      active: requests.filter((r) =>
        ACTIVE_REQUEST_STATUSES.includes(r.status as RequestStatus),
      ).length,
      completed: requests.filter((r) => r.status === 'completed').length,
    }),
    [requests],
  )

  const filtered = requests.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending'
    if (activeTab === 'active')
      return ACTIVE_REQUEST_STATUSES.includes(r.status as RequestStatus)
    if (activeTab === 'done')
      return ['completed', 'cancelled'].includes(r.status)
    return true
  })

  const monthlyData = useMemo(() => {
    const acc: { month: string; count: number }[] = []
    requests.forEach((r) => {
      const month = formatDate(locale, r.createdAt, { month: 'short' })
      const existing = acc.find((x) => x.month === month)
      if (existing) existing.count++
      else acc.push({ month, count: 1 })
    })
    return acc.slice(-6)
  }, [requests, locale])

  const acceptInvite = async (reqId: string) => {
    const res = await fetch(`/api/requests/${reqId}/accept-invite`, { method: 'POST' })
    if (!res.ok) {
      alert((await res.json().catch(() => ({}))).error ?? 'Failed')
      return
    }
    track('pro_accepted', { requestId: reqId, invite: true })
    setSelectedRequest(null)
    refresh()
  }

  const updateStatus = async (
    reqId: string,
    newStatus: RequestStatus,
    extra?: { cancellationReason?: string; quotedAmount?: number }
  ) => {
    const result = await updateRequestStatusApi(reqId, newStatus, extra)
    if (newStatus === 'accepted') track('pro_accepted', { requestId: reqId })
    if (newStatus === 'completed') track('request_completed', { requestId: reqId })
    const billing = (result as MockRequest & { billing?: { leadCharged?: boolean; amountAgorot?: number } })
      .billing
    if (billing?.leadCharged && billing.amountAgorot) {
      alert(
        t('monetization.leadCharged', {
          amount: agorotToIls(billing.amountAgorot),
        })
      )
    }
    await refresh()
    setSelectedRequest(null)
    setCancellationReason('')
  }

  const completeWithAmount = async (reqId: string) => {
    if (!featureFlags.monetization) {
      await updateStatus(reqId, 'completed')
      return
    }
    const raw = window.prompt(t('monetization.completeAmount'))
    if (raw === null) return
    const amount = Number(raw)
    if (!Number.isFinite(amount) || amount <= 0) {
      await updateStatus(reqId, 'completed')
      return
    }
    await updateStatus(reqId, 'completed', { quotedAmount: amount })
  }

  const TABS: { key: TabKey; labelKey: string; count: number | null }[] = [
    { key: 'pending', labelKey: 'pro.tabPending', count: stats.pending },
    { key: 'active', labelKey: 'pro.tabActive', count: stats.active },
    { key: 'done', labelKey: 'pro.tabDone', count: null },
    { key: 'stats', labelKey: 'pro.tabStats', count: null },
  ]

  if (user.role !== 'professional') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-lg font-bold mb-2">{t('pro.dashboard')}</p>
        <p className="text-muted-foreground text-sm mb-6">{t('pro.claimHint')}</p>
        {isDemoDataMode() ? (
          <button
            type="button"
            onClick={() => claimProfessionalProfile(DEMO_PROFESSIONAL_ID)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold"
          >
            {t('pro.claimDemo')}
          </button>
        ) : (
          <Link
            href={routes.proJoin}
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold"
          >
            {t('pro.joinWaitlist')}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black lg:text-3xl">{t('pro.dashboard')}</h1>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-muted text-muted-foreground"
          aria-label={t('common.settings')}
        >
          <Settings size={20} />
        </button>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        {t('nav.hello')}, {user.fullName}
      </p>

      <ProAvailabilityEditor />

      <div className="grid grid-cols-3 gap-3 mb-6 lg:gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 lg:p-4 text-center">
          <p className="text-2xl font-black text-yellow-700">{stats.pending}</p>
          <p className="text-xs text-yellow-600 mt-0.5">{t('pro.statPending')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 lg:p-4 text-center">
          <p className="text-2xl font-black text-blue-700">{stats.active}</p>
          <p className="text-xs text-blue-600 mt-0.5">{t('pro.statActive')}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 lg:p-4 text-center">
          <p className="text-2xl font-black text-green-700">{stats.completed}</p>
          <p className="text-xs text-green-600 mt-0.5">{t('pro.statCompleted')}</p>
        </div>
      </div>

      {proBilling && (
        <div className="bg-white rounded-2xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('pro.proTier')}</p>
              <span
                className={cn(
                  'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold',
                  proBilling.subscription_tier === 'pro' ||
                    proBilling.subscription_tier === 'pro_plus'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-foreground/70',
                )}
              >
                {proBilling.subscription_tier === 'pro' ||
                proBilling.subscription_tier === 'pro_plus'
                  ? t('monetization.tierPro')
                  : t('monetization.tierFree')}
              </span>
            </div>
            {proBilling.subscription_tier === 'pro' ||
            proBilling.subscription_tier === 'pro_plus' ? (
              <button
                type="button"
                onClick={openBillingPortal}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t('monetization.manageSubscription')}
              </button>
            ) : (
              <Link
                href="/pro/pricing"
                className="text-sm font-semibold bg-primary text-white px-3 py-2 rounded-xl"
              >
                {t('monetization.upgradeToPro')}
              </Link>
            )}
          </div>
          <p className="text-sm">
            {t('monetization.leadCreditsThisMonth')}:{' '}
            <span className="font-bold">{proBilling.lead_credits}</span>
          </p>
          {proBilling.subscription_until && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('monetization.until')} {formatDate(locale, proBilling.subscription_until)}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 min-w-[72px] py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap px-2',
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground/60 hover:text-foreground'
            )}
          >
            {t(tab.labelKey)}
            {tab.count != null && tab.count > 0 && (
              <span className="ms-1.5 bg-secondary text-secondary-foreground text-xs rounded-full px-1.5 py-0.5 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4">
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
              <BarChart3 size={15} /> {t('pro.requestsByMonth')}
            </h3>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('pro.noData')}</p>
            ) : (
              <div className="space-y-3">
                {monthlyData.map((row) => {
                  const max = Math.max(...monthlyData.map((d) => d.count), 1)
                  return (
                    <div key={row.month} className="flex items-center gap-3">
                      <span className="text-xs w-12 text-muted-foreground">{row.month}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(row.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-6">{row.count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-bold mb-3 text-sm">{t('pro.byCategory')}</h3>
            {Object.entries(
              requests.reduce<Record<string, number>>((acc, r) => {
                acc[r.category] = (acc[r.category] || 0) + 1
                return acc
              }, {})
            ).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 mb-2">
                <span className="text-sm flex-1">{cat}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${requests.length ? (count / requests.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-6 text-end">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold">{t('pro.noRequestsHere')}</p>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {filtered.map((req) => (
            <button
              key={req.id}
              type="button"
              className="w-full text-start bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all"
              onClick={() => setSelectedRequest(req)}
            >
              <div className="flex items-center justify-between mb-2">
                <RequestStatusBadge status={req.status} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatDate(locale, req.createdAt)}
                </span>
              </div>
              <p className="font-semibold text-sm">
                {req.title ?? req.description.slice(0, 60)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {req.customerName} • {req.location}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={() => setSelectedRequest(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[min(85vh,calc(100dvh-6rem))] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-black mb-4">{t('pro.requestDetails')}</h2>
            <div className="bg-muted rounded-xl p-4 space-y-2 mb-4">
              <div className="flex justify-between">
                <RequestStatusBadge status={selectedRequest.status} />
                <span className="text-xs text-muted-foreground">
                  {selectedRequest.category}
                </span>
              </div>
              <p className="font-bold">{selectedRequest.title}</p>
              <p className="text-sm text-muted-foreground">
                {selectedRequest.description}
              </p>
            </div>

            <div className="space-y-1.5 text-sm mb-4">
              <p>
                <span className="font-medium">{t('common.customer')}:</span>{' '}
                {selectedRequest.customerName}
              </p>
              {selectedRequest.customerPhone && (
                <p>
                  <span className="font-medium">{t('common.phone')}:</span>{' '}
                  {selectedRequest.customerPhone}
                </p>
              )}
              {selectedRequest.location && (
                <p>
                  <span className="font-medium">{t('common.address')}:</span>{' '}
                  {selectedRequest.location}
                </p>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="space-y-2">
                {selectedRequest.matchMode === 'multi' && !selectedRequest.professionalId ? (
                  <button
                    type="button"
                    onClick={() => acceptInvite(selectedRequest.id)}
                    className="w-full bg-success text-success-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md border-2 border-success"
                  >
                    <CheckCircle size={16} /> {t('matching.acceptInvite')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedRequest.id, 'accepted')}
                    className="w-full bg-success text-success-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md border-2 border-success"
                  >
                    <CheckCircle size={16} /> {t('pro.approve')}
                  </button>
                )}
                {featureFlags.proTemplates && (
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground w-full">
                      {t('improvements.useTemplate')}
                    </p>
                    {TEMPLATES.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCancellationReason(t(key))}
                        className="text-xs px-2 py-1 rounded-lg bg-muted"
                      >
                        {t(key).slice(0, 28)}…
                      </button>
                    ))}
                  </div>
                )}
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder={t('pro.rejectReason')}
                  className="h-16"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(selectedRequest.id, 'cancelled', {
                      cancellationReason,
                    })
                  }
                  className="w-full bg-red-50 border-2 border-destructive text-destructive py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> {t('pro.reject')}
                </button>
              </div>
            )}
            {selectedRequest.status === 'accepted' && (
              <button
                type="button"
                onClick={() => updateStatus(selectedRequest.id, 'on_the_way')}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md border-2 border-indigo-700 flex items-center justify-center gap-2"
              >
                {t('tracking.proOnTheWay')}
              </button>
            )}
            {selectedRequest.status === 'on_the_way' && (
              <>
                <ProLocationSharing
                  requestId={selectedRequest.id}
                  active={isTrackingStatus(selectedRequest.status)}
                />
                <button
                  type="button"
                  onClick={() => updateStatus(selectedRequest.id, 'in_progress')}
                  className="w-full bg-info text-info-foreground py-3 rounded-xl font-bold shadow-md border-2 border-info"
                >
                  {t('pro.startWork')}
                </button>
              </>
            )}
            {selectedRequest.status === 'in_progress' && (
              <>
                <ProLocationSharing
                  requestId={selectedRequest.id}
                  active={isTrackingStatus(selectedRequest.status)}
                />
                <button
                  type="button"
                  onClick={() => completeWithAmount(selectedRequest.id)}
                  className="w-full bg-success text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> {t('pro.markCompleted')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
