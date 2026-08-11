import { NextResponse } from 'next/server'
import {
  supabaseGetRequestById,
  supabaseUpdateProLocation,
} from '@/lib/data/supabase-requests'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { haversineKm } from '@/lib/tracking/geo'
import { estimateEtaMinutes, formatEtaMinutes } from '@/lib/tracking/eta'
import { getSimulatedTrackingState } from '@/lib/mock/live-location-simulator'
import type { LiveTrackingState } from '@/lib/tracking/types'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { locationUpdateSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'

type RouteContext = { params: Promise<{ id: string }> }

function buildState(
  req: {
    destinationLat?: number
    destinationLng?: number
    proLat?: number
    proLng?: number
    proLocationUpdatedAt?: string
    liveTrackingActive?: boolean
  },
  options?: { locale?: string; simulate?: boolean },
): LiveTrackingState {
  const locale = options?.locale ?? 'he'
  let destinationLat = req.destinationLat ?? null
  let destinationLng = req.destinationLng ?? null
  let proLat = req.proLat ?? null
  let proLng = req.proLng ?? null
  let proLocationUpdatedAt = req.proLocationUpdatedAt ?? null

  if (options?.simulate && req.liveTrackingActive) {
    const sim = getSimulatedTrackingState(
      req as Parameters<typeof getSimulatedTrackingState>[0],
      locale,
    )
    if (sim) {
      proLat = sim.proLat
      proLng = sim.proLng
      proLocationUpdatedAt = new Date().toISOString()
      return {
        destinationLat,
        destinationLng,
        proLat,
        proLng,
        proLocationUpdatedAt,
        liveTrackingActive: true,
        distanceKm: sim.distanceKm,
        etaMinutes: sim.etaMinutes,
        etaLabel: sim.etaLabel,
      }
    }
  }

  let distanceKm: number | null = null
  if (
    destinationLat != null &&
    destinationLng != null &&
    proLat != null &&
    proLng != null
  ) {
    distanceKm =
      Math.round(
        haversineKm(
          { lat: destinationLat, lng: destinationLng },
          { lat: proLat, lng: proLng },
        ) * 10,
      ) / 10
  }

  const etaMinutes = distanceKm != null ? estimateEtaMinutes(distanceKm) : null
  const etaLabel = etaMinutes != null ? formatEtaMinutes(locale, etaMinutes) : null

  return {
    destinationLat,
    destinationLng,
    proLat,
    proLng,
    proLocationUpdatedAt,
    liveTrackingActive: Boolean(req.liveTrackingActive),
    distanceKm,
    etaMinutes,
    etaLabel,
  }
}

function localeFromRequest(request: Request): string {
  const lang = request.headers.get('accept-language') ?? 'he'
  return lang.startsWith('en') ? 'en' : 'he'
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const backend = resolveDataBackend()
  const locale = localeFromRequest(request)

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
  }

  const admin = getAdminSupabaseClient()
  if (!admin) {
    return NextResponse.json({ error: 'Server config' }, { status: 503 })
  }

  const { data: row } = await admin
    .from('requests')
    .select('customer_id, professional_id')
    .eq('id', id)
    .maybeSingle()

  if (!row) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  const { data: pro } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isCustomer = row.customer_id === user.id
  const isAssignedPro = Boolean(pro && pro.id === row.professional_id)
  if (!isCustomer && !isAssignedPro) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  if (backend === 'mock') {
    return NextResponse.json({ error: 'Mock mode not available' }, { status: 503 })
  }

  if (backend === 'supabase') {
    const req = await supabaseGetRequestById(id)
    if (!req) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
    return NextResponse.json(buildState(req, { locale }))
  }

  return NextResponse.json({ error: 'No backend' }, { status: 503 })
}

export async function POST(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(request, 'location-post', 120, 60_000)
  if (limited) return limited

  const { id } = await context.params
  const locale = localeFromRequest(request)

  try {
    const parsed = await parseJsonBody(request, locationUpdateSchema)
    if (!parsed.success) return parsed.response
    const { lat, lng } = parsed.data

    const backend = resolveDataBackend()

    if (backend === 'supabase') {
      const supabase = await createServerSupabaseClient()
      if (!supabase) {
        return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
      }

      const existing = await supabaseGetRequestById(id)
      if (!existing) {
        return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
      }

      const { data: pro } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .maybeSingle()

      if (!pro || pro.id !== existing.professionalId) {
        return NextResponse.json(
          { error: 'רק איש המקצוע יכול לעדכן מיקום' },
          { status: 403 },
        )
      }

      const ok = await supabaseUpdateProLocation(id, lat, lng)
      if (!ok) return NextResponse.json({ error: 'עדכון נכשל' }, { status: 500 })

      const updated = await supabaseGetRequestById(id)
      return NextResponse.json(buildState(updated!, { locale }))
    }

    if (backend === 'mock') {
      return NextResponse.json({ error: 'Mock mode not available' }, { status: 503 })
    }

    return NextResponse.json({ error: 'No backend' }, { status: 503 })
  } catch (error) {
    trackError(error, { route: 'POST /api/requests/[id]/location' })
    return NextResponse.json({ error: 'שגיאה בעדכון מיקום' }, { status: 500 })
  }
}
