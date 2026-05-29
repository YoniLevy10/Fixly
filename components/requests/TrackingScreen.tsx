'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Loader,
  Star,
} from 'lucide-react'
import { getProfessional } from '@/lib/data/professionals-service'
import RequestStatusBadge from '@/components/shared/RequestStatusBadge'
import { routes } from '@/lib/routes'
import type { MockRequest } from '@/mock/requests'
import type { RequestStatus } from '@/shared/constants/request-status'

const STEPS: { key: RequestStatus; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'ממתין לאישור', icon: Clock },
  { key: 'accepted', label: 'אושר', icon: CheckCircle },
  { key: 'in_progress', label: 'בתהליך', icon: Loader },
  { key: 'completed', label: 'הושלם', icon: CheckCircle },
]

const STATUS_ORDER: RequestStatus[] = [
  'pending',
  'accepted',
  'in_progress',
  'completed',
]

type TrackingScreenProps = {
  requestId: string
}

export default function TrackingScreen({ requestId }: TrackingScreenProps) {
  const router = useRouter()
  const [request, setRequest] = useState<MockRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/requests/${requestId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRequest(data))
      .finally(() => setLoading(false))
  }, [requestId])

  const [professional, setProfessional] = useState<Awaited<
    ReturnType<typeof getProfessional>
  >>(undefined)

  useEffect(() => {
    if (request?.professionalId) {
      getProfessional(request.professionalId).then(setProfessional)
    }
  }, [request?.professionalId])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-20 px-4">
        <p>הבקשה לא נמצאה</p>
        <Link href={routes.myRequests} className="text-primary mt-4 inline-block">
          חזרה לבקשות
        </Link>
      </div>
    )
  }

  const currentStepIndex = STATUS_ORDER.indexOf(
    request.status as (typeof STATUS_ORDER)[number]
  )
  const isCancelled = request.status === 'cancelled'
  const isCompleted = request.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 max-w-3xl mx-auto lg:max-w-4xl">
      <div className="bg-white px-4 py-4 lg:px-8 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10 lg:static lg:rounded-t-2xl lg:mt-6 lg:border lg:mx-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-muted"
          aria-label="חזרה"
        >
          <ArrowRight size={18} />
        </button>
        <h1 className="font-black text-lg flex-1 lg:text-xl">מעקב בקשה</h1>
        <RequestStatusBadge status={request.status} size="sm" />
      </div>

      <div className="px-4 py-5 space-y-4 lg:px-8 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">{request.category}</p>
            <h2 className="font-bold text-base mb-1">
              {request.title ?? request.description}
            </h2>
            <p className="text-sm text-gray-500">{request.location}</p>
          </div>

          {professional && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg bg-cover bg-center"
                style={{
                  backgroundImage: professional.avatarUrl
                    ? `url(${professional.avatarUrl})`
                    : undefined,
                }}
              >
                {!professional.avatarUrl && professional.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold">{professional.name}</p>
                <p className="text-sm text-gray-500">
                  {professional.title ?? professional.category}
                </p>
              </div>
              <div className="flex items-center gap-1 text-yellow-500 font-semibold text-sm">
                <Star size={14} fill="currentColor" />
                {professional.rating.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        <div>
          {!isCancelled && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold mb-5">סטטוס הבקשה</h3>
              <div className="space-y-4">
                {STEPS.map((step, index) => {
                  const Icon = step.icon
                  const done = currentStepIndex > index
                  const active = currentStepIndex === index && !isCompleted
                  const completedStep =
                    isCompleted && index <= STATUS_ORDER.length - 1

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          done || completedStep
                            ? 'bg-primary text-white'
                            : active
                              ? 'bg-primary/20 text-primary'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon size={18} className={active ? 'animate-spin' : ''} />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          done || active || completedStep
                            ? 'text-foreground'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-50 text-red-800 rounded-2xl p-4 text-center text-sm font-medium mt-4">
              הבקשה בוטלה
            </div>
          )}

          {isCompleted && (
            <div className="bg-green-50 text-green-800 rounded-2xl p-4 text-center text-sm mt-4">
              הבקשה הושלמה בהצלחה 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
