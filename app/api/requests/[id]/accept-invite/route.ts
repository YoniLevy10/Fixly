import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { recordProResponseTime } from '@/lib/matching/response-time'
import { handleLeadOnAccept } from '@/lib/monetization/record-billing'
import { featureFlags } from '@/lib/feature-flags'
import { trackError } from '@/lib/monitoring/track-error'
import { emitWebhookForRequestId } from '@/lib/integrations/bamakor/jobs-service'
import { resolveDataBackend } from '@/lib/data/resolve-backend'
import { getRequestById, updateRequestStatus } from '@/lib/data/request-store'
import { DEMO_PROFESSIONAL_ID } from '@/lib/auth/constants'
import { getProfessionalById } from '@/mock/professionals'

type RouteContext = { params: Promise<{ id: string }> }

/** Pro accepts a multi-match invite — first accept wins */
export async function POST(_request: Request, context: RouteContext) {
  const { id: requestId } = await context.params

  // Investor demo — assign first available candidate (defaults to demo pro "1")
  if (resolveDataBackend() === 'mock') {
    const existing = getRequestById(requestId)
    if (!existing || existing.status !== 'pending') {
      return NextResponse.json({ error: 'Request not available' }, { status: 409 })
    }
    if (existing.professionalId) {
      return NextResponse.json({ error: 'Already assigned' }, { status: 409 })
    }

    const invite =
      existing.candidates?.find((c) => c.professionalId === DEMO_PROFESSIONAL_ID) ??
      existing.candidates?.[0]
    const proId = invite?.professionalId ?? DEMO_PROFESSIONAL_ID
    const pro = getProfessionalById(proId)
    const proName = invite?.name ?? pro?.name ?? 'איש מקצוע'

    const updated = updateRequestStatus(requestId, 'accepted', {
      professionalId: proId,
      professionalName: proName,
      candidates: existing.candidates?.map((c) => ({
        ...c,
        status: c.professionalId === proId ? 'accepted' : 'expired',
      })),
    })
    if (!updated) {
      return NextResponse.json({ error: 'Accept failed' }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      professionalId: proId,
      professionalName: proName,
    })
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, title')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro) return NextResponse.json({ error: 'Not a professional' }, { status: 403 })

  const admin = getAdminSupabaseClient()
  if (!admin) return NextResponse.json({ error: 'Server config' }, { status: 503 })

  const { data: billing } = await admin
    .from('professionals')
    .select('subscription_tier, lead_credits, subscription_until')
    .eq('id', pro.id)
    .maybeSingle()

  if (billing) {
    const tier = (billing.subscription_tier as string) || 'free'
    const subActive =
      billing.subscription_until &&
      new Date(billing.subscription_until as string) > new Date()
    const credits = (billing.lead_credits as number) ?? 0
    const isPaidTier = tier === 'pro' || tier === 'pro_plus'

    if (!isPaidTier && !subActive && credits <= 0) {
      return NextResponse.json(
        { error: 'אין קרדיטי לידים — יש לשדרג מנוי', upgradeUrl: '/pro/pricing' },
        { status: 402 },
      )
    }
  }

  const { data: req } = await admin
    .from('requests')
    .select('id, status, match_mode, created_at, professional_id, callback_url')
    .eq('id', requestId)
    .maybeSingle()

  if (!req || req.status !== 'pending') {
    return NextResponse.json({ error: 'Request not available' }, { status: 409 })
  }

  if (req.professional_id) {
    return NextResponse.json({ error: 'Already assigned' }, { status: 409 })
  }

  const { data: candidate } = await admin
    .from('request_candidates')
    .select('id, status')
    .eq('request_id', requestId)
    .eq('professional_id', pro.id)
    .eq('status', 'invited')
    .maybeSingle()

  if (!candidate) {
    return NextResponse.json({ error: 'No invite' }, { status: 404 })
  }

  try {
    const now = new Date().toISOString()

    await admin
      .from('requests')
      .update({
        professional_id: pro.id,
        status: 'accepted',
        accepted_at: now,
      })
      .eq('id', requestId)
      .is('professional_id', null)

    await admin
      .from('request_candidates')
      .update({ status: 'accepted', responded_at: now })
      .eq('id', candidate.id)

    await admin
      .from('request_candidates')
      .update({ status: 'expired', responded_at: now })
      .eq('request_id', requestId)
      .neq('id', candidate.id)
      .eq('status', 'invited')

    await recordProResponseTime(pro.id, req.created_at as string)

    if (featureFlags.monetization) {
      await handleLeadOnAccept(pro.id, requestId)
    }

    if (req.callback_url) {
      await emitWebhookForRequestId(requestId, 'offered').catch((err) =>
        trackError(err, { route: 'accept-invite webhook' }),
      )
    }

    return NextResponse.json({ ok: true, professionalId: pro.id, professionalName: pro.title })
  } catch (error) {
    trackError(error, { route: 'POST accept-invite' })
    return NextResponse.json({ error: 'Accept failed' }, { status: 500 })
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params

  if (resolveDataBackend() === 'mock') {
    const req = getRequestById(id)
    return NextResponse.json(req?.candidates ?? [])
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json([])

  const { data } = await supabase
    .from('request_candidates')
    .select('professional_id, rank, status, professionals(title, rating, is_verified)')
    .eq('request_id', id)
    .order('rank')

  return NextResponse.json(data ?? [])
}
