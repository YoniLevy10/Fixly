'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Sparkles,
  Star,
} from 'lucide-react'
import BackButton from '@/components/shared/BackButton'
import { fetchProfessional } from '@/lib/data/fetch-professional'
import type { Professional } from '@/types/professional'
import RequestStatusBadge from '@/components/shared/RequestStatusBadge'
import { routes } from '@/lib/routes'
import { useRequestRealtime } from '@/shared/hooks/use-request-realtime'
import ReviewForm from '@/components/reviews/ReviewForm'
import ShareRequestButton from '@/components/requests/ShareRequestButton'
import WhatsAppButton from '@/components/contact/WhatsAppButton'
import FixlyGuaranteeBanner from '@/components/shared/FixlyGuaranteeBanner'
import RequestChat from '@/components/chat/RequestChat'
import JobPaymentButton from '@/components/payments/JobPaymentButton'
import VerifiedBadge from '@/components/shared/VerifiedBadge'
import ResponseTimeBadge from '@/components/shared/ResponseTimeBadge'
import { buildRequestWhatsAppMessage } from '@/lib/contact/whatsapp-link'
import { publicEnv } from '@/lib/env/public-env'
import { useLocale } from '@/lib/i18n/locale-provider'
import type { MockRequest } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'
import { featureFlags } from '@/lib/feature-flags'
import { isTrackingStatus } from '@/lib/tracking/geo'
import { useLiveTracking } from '@/shared/hooks/use-live-tracking'
import { useTrackingPushAlerts } from '@/shared/hooks/use-tracking-push-alerts'
import {
  DEMO_TOUR_EVENT,
  readTourRequest,
} from '@/lib/demo/tour-session'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/cn'

const LiveTrackingMap = dynamic(
  () => import('@/components/tracking/LiveTrackingMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-muted/60" />
    ),
  },
)

const STATUS_ORDER: RequestStatus[] = [
  'pending',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
]

type TrackingScreenProps = {
  requestId: string
}

function statusTone(status: string) {
  switch (status) {
    case 'pending':
      return 'from-amber-400/25 via-orange-300/10 to-transparent'
    case 'accepted':
      return 'from-sky-400/25 via-primary/10 to-transparent'
    case 'on_the_way':
      return 'from-secondary/30 via-orange-200/15 to-transparent'
    case 'in_progress':
      return 'from-info/25 via-cyan-200/10 to-transparent'
    case 'completed':
      return 'from-success/30 via-emerald-200/15 to-transparent'
    case 'cancelled':
      return 'from-destructive/20 via-red-200/10 to-transparent'
    default:
      return 'from-primary/15 to-transparent'
  }
}

export default function TrackingScreen({ requestId }: TrackingScreenProps) {
  const router = useRouter()
  const { t } = useLocale()
  const [request, setRequest] = useState<MockRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const steps = useMemo(
    () =>
      [
        { key: 'pending' as const, labelKey: 'status.pending', icon: Clock3 },
        { key: 'accepted' as const, labelKey: 'status.accepted', icon: CheckCircle2 },
        { key: 'on_the_way' as const, labelKey: 'status.on_the_way', icon: Navigation },
        { key: 'in_progress' as const, labelKey: 'status.in_progress', icon: Loader2 },
        { key: 'completed' as const, labelKey: 'status.completed', icon: Sparkles },
      ] as const,
    [],
  )

  const loadRequest = useCallback(() => {
    const local = readTourRequest(requestId)
    if (local) {
      setRequest(local)
      setLoading(false)
    }

    const statusRank = (s: string | undefined) => {
      const i = STATUS_ORDER.indexOf(s as (typeof STATUS_ORDER)[number])
      return i >= 0 ? i : -1
    }

    fetch(`/api/requests/${requestId}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          if (!local) {
            return fetch(
              `/api/demo/requests?id=${encodeURIComponent(requestId)}`,
              { cache: 'no-store' },
            )
              .then((r) => (r.ok ? r.json() : null))
              .then((demo) => {
                if (demo) setRequest(demo)
              })
          }
          return
        }
        const latestLocal = readTourRequest(requestId)
        if (
          latestLocal &&
          statusRank(latestLocal.status) > statusRank(data.status)
        ) {
          setRequest(latestLocal)
          return
        }
        setRequest(data)
      })
      .finally(() => setLoading(false))
  }, [requestId])

  useEffect(() => {
    loadRequest()
  }, [loadRequest])

  useEffect(() => {
    const onTour = (event: Event) => {
      const detail = (event as CustomEvent<MockRequest>).detail
      if (detail?.id === requestId) setRequest(detail)
    }
    window.addEventListener(DEMO_TOUR_EVENT, onTour)
    const poll = window.setInterval(() => {
      const local = readTourRequest(requestId)
      if (local) setRequest(local)
    }, 1200)
    return () => {
      window.removeEventListener(DEMO_TOUR_EVENT, onTour)
      window.clearInterval(poll)
    }
  }, [requestId])

  useRequestRealtime(requestId, (updated) => setRequest(updated))

  const showLiveMap =
    featureFlags.liveTracking &&
    request != null &&
    isTrackingStatus(request.status) &&
    (request.liveTrackingActive || request.status === 'on_the_way')

  const { tracking: liveTracking } = useLiveTracking(
    requestId,
    Boolean(showLiveMap),
  )

  useTrackingPushAlerts({
    requestId,
    professionalName: request?.professionalName,
    enabled: Boolean(showLiveMap),
    tracking: liveTracking,
  })

  const [professional, setProfessional] = useState<Professional | undefined>(
    undefined,
  )

  useEffect(() => {
    if (request?.professionalId) {
      fetchProfessional(request.professionalId).then(setProfessional)
    }
  }, [request?.professionalId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center ios27-atmosphere">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="px-4 py-20 text-center ios27-atmosphere">
        <p className="font-bold">{t('requests.notFound')}</p>
        <Link
          href={routes.myRequests}
          className="mt-4 inline-block text-primary font-semibold"
        >
          {t('requests.backToRequests')}
        </Link>
      </div>
    )
  }

  const currentStepIndex = STATUS_ORDER.indexOf(
    request.status as (typeof STATUS_ORDER)[number],
  )
  const isCancelled = request.status === 'cancelled'
  const isCompleted = request.status === 'completed'
  const isPending = request.status === 'pending'
  const chatEnabled =
    Boolean(request.professionalId) &&
    ['accepted', 'on_the_way', 'in_progress', 'completed'].includes(request.status)
  const isPendingMulti =
    request.status === 'pending' &&
    request.matchMode === 'multi' &&
    !request.professionalId
  const appBase =
    typeof window !== 'undefined'
      ? window.location.origin
      : publicEnv.appUrl || 'https://fixly.tech'
  const whatsAppMessage =
    professional?.phone && request
      ? buildRequestWhatsAppMessage({
          proName: professional.name,
          customerName: request.customerName,
          description: request.description,
          location: request.location,
          trackingUrl: `${appBase}${routes.tracking(request.id)}`,
        })
      : ''
  const progressPct =
    currentStepIndex < 0
      ? 0
      : Math.min(100, Math.round(((currentStepIndex + 1) / STATUS_ORDER.length) * 100))

  const title = request.title ?? request.description
  const proName =
    professional?.name ?? request.professionalName ?? t('chat.proFallback')

  return (
    <div
      data-testid="tracking-status"
      className="relative min-h-[100dvh] ios27-atmosphere pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b',
          statusTone(request.status),
        )}
      />

      <div className="relative mx-auto max-w-3xl lg:max-w-5xl">
        {/* Sticky glass header */}
        <header className="sticky top-[var(--fixly-tour-narrator-h,0px)] z-20 mx-3 mt-2 apple-glass rounded-[var(--radius-lg)] px-3 py-3 flex items-center gap-3 safe-area-pt animate-ios-fade lg:mx-6 lg:mt-4">
          <BackButton onClick={() => router.back()} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {t('orderHub.eyebrow')}
            </p>
            <h1 className="truncate text-base font-black text-foreground lg:text-lg">
              {t('orderHub.title')}
            </h1>
          </div>
          <RequestStatusBadge status={request.status} size="sm" />
        </header>

        <div className="relative space-y-4 px-3 pt-4 lg:grid lg:grid-cols-5 lg:gap-5 lg:space-y-0 lg:px-6 lg:pt-5">
          {/* Main column */}
          <div className="space-y-4 lg:col-span-3">
            {/* Hero status */}
            <section className="ios27-surface relative overflow-hidden p-5 animate-ios-slide-up">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-secondary">
                    {request.category}
                  </p>
                  <h2 className="mt-1 text-xl font-black leading-snug text-foreground lg:text-2xl">
                    {title}
                  </h2>
                  {request.location ? (
                    <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-foreground/70">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                      <span>{request.location}</span>
                    </p>
                  ) : null}
                </div>
                <div className="apple-glass-pill shrink-0 rounded-2xl px-3 py-2 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {t('orderHub.progress')}
                  </p>
                  <p className="text-lg font-black tabular-nums text-primary">
                    {progressPct}%
                  </p>
                </div>
              </div>

              <div className="mt-4" data-tour="status-progress">
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-secondary via-primary to-success transition-all duration-500 ease-[var(--ease)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {isPending
                    ? t('orderHub.waitingApproval')
                    : chatEnabled
                      ? t('orderHub.canChat')
                      : t(`status.${request.status}`)}
                </p>
              </div>

              {request.description && request.title ? (
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                  {request.description}
                </p>
              ) : null}

              {(request.preferredDate || request.preferredTime) && (
                <p className="mt-3 text-xs font-bold text-muted-foreground">
                  {t('orderHub.preferred')}:{' '}
                  {[request.preferredDate, request.preferredTime]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}

              {request.images && request.images.length > 0 ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {request.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-border/50"
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <ShareRequestButton
                  requestId={request.id}
                  title={title}
                />
              </div>
            </section>

            {isPendingMulti && (
              <section className="ios27-surface border border-amber-200/80 bg-amber-50/80 p-4 animate-ios-fade">
                <p className="font-black text-amber-950">
                  {t('matching.waitingTitle')}
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  {t('matching.waitingBody')}
                </p>
                {request.candidates?.length ? (
                  <ul className="mt-3 space-y-2">
                    {request.candidates.map((c) => (
                      <li
                        key={c.professionalId}
                        className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"
                      >
                        <span className="font-semibold">{c.name}</span>
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star size={12} fill="currentColor" />
                          {c.rating.toFixed(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            )}

            {/* Professional card */}
            {(professional || request.professionalId) && (
              <section className="ios27-surface p-4 animate-ios-slide-up">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {t('orderHub.yourPro')}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-black text-white bg-cover bg-center ring-2 ring-white shadow-md"
                    style={{
                      backgroundImage: professional?.avatarUrl
                        ? `url(${professional.avatarUrl})`
                        : undefined,
                    }}
                  >
                    {!professional?.avatarUrl && proName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-black text-foreground">
                        {proName}
                      </p>
                      {professional?.isVerified && <VerifiedBadge />}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {professional?.title ??
                        professional?.category ??
                        request.category}
                    </p>
                    {professional && (
                      <ResponseTimeBadge
                        avgResponseMinutes={professional.avgResponseMinutes}
                        className="mt-1"
                      />
                    )}
                  </div>
                  {professional?.rating != null && (
                    <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                      <Star size={14} fill="currentColor" />
                      {professional.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  {chatEnabled && (
                    <a
                      href="#order-chat"
                      className="apple-glass-pill flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-primary transition-transform active:scale-[0.98]"
                    >
                      <MessageCircle size={16} />
                      {t('orderHub.openChat')}
                    </a>
                  )}
                  {professional?.phone && whatsAppMessage && (
                    <div className="flex-1">
                      <WhatsAppButton
                        phone={professional.phone}
                        message={whatsAppMessage}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {isPending && !isPendingMulti && (
              <section className="ios27-surface flex items-start gap-3 p-4 animate-ios-fade">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <Clock3 size={20} className="animate-pulse" />
                </div>
                <div>
                  <p className="font-black text-foreground">
                    {t('orderHub.pendingTitle')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('orderHub.pendingBody')}
                  </p>
                </div>
              </section>
            )}

            {showLiveMap && liveTracking?.liveTrackingActive && liveTracking.proLat != null && (
              <section className="ios27-surface overflow-hidden p-3" data-tour="live-map">
                <p className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-secondary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                  {t('tracking.liveTitle')}
                </p>
                <LiveTrackingMap tracking={liveTracking} />
                <p className="mt-2 px-1 text-xs text-muted-foreground">
                  {t('tracking.liveHint')}
                </p>
              </section>
            )}

            {showLiveMap &&
              liveTracking?.liveTrackingActive &&
              liveTracking.proLat == null && (
                <p className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">
                  {t('tracking.waitingForPro')}
                </p>
              )}

            <FixlyGuaranteeBanner compact />
          </div>

          {/* Side column: timeline + chat */}
          <div className="space-y-4 lg:col-span-2">
            {!isCancelled && (
              <section
                className="ios27-surface p-5 animate-ios-slide-up"
                data-tour="status-timeline"
              >
                <h3 className="mb-4 font-black text-foreground">
                  {t('requests.statusTitle')}
                </h3>
                <ol className="space-y-0">
                  {steps.map((step, index) => {
                    const Icon = step.icon
                    const done = currentStepIndex > index
                    const active = currentStepIndex === index && !isCompleted
                    const completedStep =
                      isCompleted && index <= STATUS_ORDER.length - 1
                    const reached = done || active || completedStep
                    return (
                      <li key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-full ring-2 transition-colors duration-[var(--dur-2)]',
                              done || completedStep
                                ? 'bg-success text-success-foreground ring-success/40'
                                : active
                                  ? 'bg-secondary text-secondary-foreground ring-secondary/40 animate-pulse'
                                  : 'bg-muted text-foreground/35 ring-border',
                            )}
                          >
                            <Icon
                              size={16}
                              className={
                                active && step.key === 'in_progress'
                                  ? 'animate-spin'
                                  : undefined
                              }
                            />
                          </div>
                          {index < steps.length - 1 && (
                            <div
                              className={cn(
                                'my-1 w-0.5 flex-1 min-h-[1.1rem] rounded-full',
                                done || (isCompleted && index < steps.length - 1)
                                  ? 'bg-success/70'
                                  : 'bg-border',
                              )}
                            />
                          )}
                        </div>
                        <div className="pb-4 pt-1.5">
                          <p
                            className={cn(
                              'text-sm',
                              reached
                                ? 'font-bold text-foreground'
                                : 'font-medium text-foreground/40',
                            )}
                          >
                            {t(step.labelKey)}
                          </p>
                          {active && step.key === 'accepted' && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {t('orderHub.acceptedHint')}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )}

            {isCancelled && (
              <div className="rounded-[var(--radius-lg)] bg-red-50 p-4 text-center text-sm font-semibold text-red-800">
                {t('requests.cancelled')}
              </div>
            )}

            {isCompleted && (
              <div className="space-y-3 animate-ios-fade">
                <div className="rounded-[var(--radius-lg)] bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-900">
                  {t('requests.completed')}
                </div>
                <JobPaymentButton
                  requestId={request.id}
                  amountIls={request.quotedAmount}
                  paymentStatus={request.paymentStatus}
                  onPaid={(paid) => setRequest(paid)}
                />
                {request.professionalId && (
                  <Link
                    href={`${routes.newRequest}?professional=${request.professionalId}`}
                    className="block text-center text-sm font-bold text-primary"
                  >
                    {t('improvements.repeatRequest')}
                  </Link>
                )}
                <ReviewForm
                  requestId={request.id}
                  professionalId={request.professionalId}
                />
              </div>
            )}

            <div id="order-chat">
              <RequestChat
                requestId={request.id}
                enabled={chatEnabled}
                professionalName={proName}
                expanded
                lockedHint={t('chat.lockedBody')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
