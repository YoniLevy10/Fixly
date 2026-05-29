'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import RequestStatusBadge from '@/components/shared/RequestStatusBadge'
import { useAuth } from '@/lib/auth/auth-provider'
import { formatDate } from '@/lib/i18n/format-date'
import { useLocale } from '@/lib/i18n/locale-provider'
import { useRequestsList } from '@/shared/hooks/use-requests-api'
import { useRequestsListRealtime } from '@/shared/hooks/use-request-realtime'
import { routes } from '@/lib/routes'
import type { RequestStatus } from '@/shared/constants/request-status'

export default function MyRequestsScreen() {
  const router = useRouter()
  const { locale, dir, t } = useLocale()
  const { requests, loading, refresh } = useRequestsList({ scope: 'mine' })
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight

  useRequestsListRealtime(refresh)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
      <h1 className="text-2xl font-black mb-6 lg:text-3xl">{t('requests.myTitle')}</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">{t('requests.emptyTitle')}</h2>
          <p className="text-muted-foreground mb-4">{t('requests.emptyHint')}</p>
          <Link
            href={routes.professionals}
            className="text-primary underline font-medium"
          >
            {t('requests.searchNow')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {requests.map((req) => (
            <button
              key={req.id}
              type="button"
              className="w-full text-start bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all"
              onClick={() => router.push(routes.tracking(req.id))}
            >
              <div className="flex items-center justify-between">
                <Chevron size={18} className="text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="text-xs text-muted-foreground">{req.category}</span>
                    <RequestStatusBadge status={req.status as RequestStatus} size="sm" />
                  </div>
                  <p className="font-semibold text-sm truncate">
                    {req.title ?? req.description.slice(0, 50)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {req.professionalName} • {formatDate(locale, req.createdAt)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
