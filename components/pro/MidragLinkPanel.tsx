'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Link2, Unlink } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import MidragVerifiedBadge from '@/components/shared/MidragVerifiedBadge'
import Input from '@/components/ui/Input'
import { isDemoDataMode } from '@/lib/data/demo-mode'
import { parseMidragUrl } from '@/lib/integrations/midrag/scraper'
import { track } from '@/lib/analytics/track'

type MidragStatus = {
  linked: boolean
  profileUrl: string | null
  rating: number | null
  reviewsCount: number
  verified: boolean
  lastSyncedAt: string | null
}

const DEMO_MIDRAG_KEY = 'fixly-demo-midrag-link'

function readDemoMidrag(proId: string): MidragStatus | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${DEMO_MIDRAG_KEY}:${proId}`)
    if (!raw) return null
    return JSON.parse(raw) as MidragStatus
  } catch {
    return null
  }
}

function writeDemoMidrag(proId: string, status: MidragStatus | null) {
  const key = `${DEMO_MIDRAG_KEY}:${proId}`
  if (!status) sessionStorage.removeItem(key)
  else sessionStorage.setItem(key, JSON.stringify(status))
}

/**
 * Pro console: paste Midrag profile URL → fetch rating/reviews → show verified badge.
 * Uses POST /api/pro/midrag/link (+ unlink). Demo mode falls back to sessionStorage.
 */
export default function MidragLinkPanel() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<MidragStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const professionalId = user.professionalId

  const applyFromPro = useCallback(
    (pro: {
      midragProfileUrl?: string | null
      midragRating?: number | null
      midragReviewsCount?: number
      midragVerified?: boolean
      midragLastSyncedAt?: string | null
    }) => {
      const linked = Boolean(pro.midragVerified && pro.midragProfileUrl)
      setStatus({
        linked,
        profileUrl: pro.midragProfileUrl ?? null,
        rating: pro.midragRating ?? null,
        reviewsCount: pro.midragReviewsCount ?? 0,
        verified: Boolean(pro.midragVerified),
        lastSyncedAt: pro.midragLastSyncedAt ?? null,
      })
      if (pro.midragProfileUrl) setUrl(pro.midragProfileUrl)
    },
    [],
  )

  useEffect(() => {
    if (user.role !== 'professional' || !professionalId) return
    setLoading(true)
    setError(null)

    const demo = isDemoDataMode() ? readDemoMidrag(professionalId) : null
    if (demo) {
      setStatus(demo)
      if (demo.profileUrl) setUrl(demo.profileUrl)
      setLoading(false)
      return
    }

    fetch(`/api/professionals/${professionalId}`)
      .then(async (res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((pro) => {
        if (pro) applyFromPro(pro)
        else setStatus({ linked: false, profileUrl: null, rating: null, reviewsCount: 0, verified: false, lastSyncedAt: null })
      })
      .catch(() => {
        setStatus({ linked: false, profileUrl: null, rating: null, reviewsCount: 0, verified: false, lastSyncedAt: null })
      })
      .finally(() => setLoading(false))
  }, [user.role, professionalId, applyFromPro])

  if (user.role !== 'professional') return null

  const linkProfile = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)

    const parsed = parseMidragUrl(url)
    if (!parsed) {
      setError(t('midrag.invalidUrl'))
      setBusy(false)
      return
    }

    try {
      const res = await fetch('/api/pro/midrag/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsed.fullUrl }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        message?: string
        profile?: { rating?: number; reviews_count?: number; name?: string }
      }

      if (res.ok && data.profile) {
        const next: MidragStatus = {
          linked: true,
          profileUrl: parsed.fullUrl,
          rating: data.profile.rating ?? null,
          reviewsCount: data.profile.reviews_count ?? 0,
          verified: true,
          lastSyncedAt: new Date().toISOString(),
        }
        setStatus(next)
        setMessage(t('midrag.linkSuccess'))
        track('midrag_linked', {
          rating: next.rating ?? 0,
          reviews: next.reviewsCount,
        })
        setBusy(false)
        return
      }

      // Demo / no Supabase session — simulate link for investor demos
      if (
        isDemoDataMode() &&
        professionalId &&
        (res.status === 401 || data.error === 'no_session' || data.error === 'unauthorized')
      ) {
        const next: MidragStatus = {
          linked: true,
          profileUrl: parsed.fullUrl,
          rating: 9.2,
          reviewsCount: 128,
          verified: true,
          lastSyncedAt: new Date().toISOString(),
        }
        writeDemoMidrag(professionalId, next)
        setStatus(next)
        setMessage(t('midrag.linkSuccessDemo'))
        track('midrag_linked_demo', { url: parsed.fullUrl })
        setBusy(false)
        return
      }

      setError(data.message || t('midrag.linkFailed'))
    } catch {
      setError(t('midrag.linkFailed'))
    } finally {
      setBusy(false)
    }
  }

  const unlinkProfile = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/pro/midrag/unlink', { method: 'DELETE' })
      if (res.ok) {
        setStatus({
          linked: false,
          profileUrl: null,
          rating: null,
          reviewsCount: 0,
          verified: false,
          lastSyncedAt: null,
        })
        setUrl('')
        setMessage(t('midrag.unlinkSuccess'))
        if (professionalId) writeDemoMidrag(professionalId, null)
        track('midrag_unlinked')
        setBusy(false)
        return
      }

      if (isDemoDataMode() && professionalId && (res.status === 401 || res.status === 404)) {
        writeDemoMidrag(professionalId, null)
        setStatus({
          linked: false,
          profileUrl: null,
          rating: null,
          reviewsCount: 0,
          verified: false,
          lastSyncedAt: null,
        })
        setUrl('')
        setMessage(t('midrag.unlinkSuccess'))
        setBusy(false)
        return
      }

      setError(t('midrag.unlinkFailed'))
    } catch {
      setError(t('midrag.unlinkFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border-2 border-border p-4 mb-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h2 className="font-bold flex items-center gap-2">
            <Link2 size={16} className="text-sky-700" />
            {t('midrag.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('midrag.hint')}</p>
        </div>
        {status?.verified ? <MidragVerifiedBadge /> : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : status?.linked ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-sky-900">
              {t('trust.midragScore', {
                rating: String(status.rating ?? '—'),
                count: String(status.reviewsCount ?? 0),
              })}
            </p>
            {status.profileUrl ? (
              <a
                href={status.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-800 underline-offset-2 hover:underline"
              >
                {t('midrag.openProfile')}
                <ExternalLink size={12} />
              </a>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void unlinkProfile()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
          >
            <Unlink size={14} />
            {busy ? '…' : t('midrag.unlink')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="midrag-url">
            {t('midrag.urlLabel')}
          </label>
          <Input
            id="midrag-url"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.midrag.co.il/SpCard/Sp/12345"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{t('midrag.urlHelp')}</p>
          <button
            type="button"
            onClick={() => void linkProfile()}
            disabled={busy || !url.trim()}
            className="bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 hover:bg-sky-800"
          >
            {busy ? t('midrag.linking') : t('midrag.link')}
          </button>
        </div>
      )}

      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600 mt-3">{message}</p> : null}
    </div>
  )
}
