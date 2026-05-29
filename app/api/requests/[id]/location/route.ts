import { NextResponse } from 'next/server'
import { getRequestById, updateRequestLocation } from '@/lib/data/request-store'
import {
  supabaseGetRequestById,
  supabaseUpdateProLocation,
} from '@/lib/data/supabase-requests'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { haversineKm } from '@/lib/tracking/geo'
import { estimateEtaMinutes, formatEtaMinutes } from '@/lib/tracking/eta'
import { getSimulatedTrackingState } from '@/lib/mock/live-location-simulator'
import type { LiveTrackingState } from '@/lib/tracking/types'

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
  options?: { locale?: string; simulate?: boolean }
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
      locale
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
          { lat: proLat, lng: proLng }
        ) * 10
      ) / 10
  }

  const etaMinutes =
    distanceKm != null ? estimateEtaMinutes(distanceKm) : null
  const etaLabel =
    etaMinutes != null ? formatEtaMinutes(locale, etaMinutes) : null

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

  if (backend === 'supabase') {
    const req = await supabaseGetRequestById(id)
    if (!req) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
    return NextResponse.json(buildState(req, { locale }))
  }

  if (backend === 'mock') {
    const req = getRequestById(id)
    if (!req) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
    return NextResponse.json(buildState(req, { locale, simulate: true }))
  }

  return NextResponse.json({ error: 'No backend' }, { status: 503 })
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const lat = Number(body.lat)
  const lng = Number(body.lng)
  const locale = localeFromRequest(request)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'קואורדינטות לא תקינות' }, { status: 400 })
  }

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
      return NextResponse.json({ error: 'רק איש המקצוע יכול לעדכן מיקום' }, { status: 403 })
    }

    const ok = await supabaseUpdateProLocation(id, lat, lng)
    if (!ok) return NextResponse.json({ error: 'עדכון נכשל' }, { status: 500 })

    const updated = await supabaseGetRequestById(id)
    return NextResponse.json(buildState(updated!, { locale }))
  }

  if (backend === 'mock') {
    const updated = updateRequestLocation(id, lat, lng)
    if (!updated) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
    return NextResponse.json(buildState(updated, { locale, simulate: true }))
  }

  return NextResponse.json({ error: 'No backend' }, { status: 503 })
}
