import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  parseMidragUrl,
  fetchMidragProfile,
  midragToFixlyRating,
} from '@/lib/integrations/midrag/scraper'
import { trackError } from '@/lib/monitoring/track-error'
import { enforceRateLimit } from '@/lib/api/rate-limit'

export const dynamic = 'force-dynamic'

/** POST /api/pro/midrag/link — link Midrag profile + import reviews */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'pro-midrag-link', 10, 60_000)
  if (limited) return limited

  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'no_session' }, { status: 401 })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = parseMidragUrl(body.url ?? '')
  if (!parsed) {
    return NextResponse.json(
      {
        error: 'invalid_url',
        message:
          'הזן קישור תקין ממדרג (לדוגמה: https://www.midrag.co.il/SpCard/Sp/12345)',
      },
      { status: 400 },
    )
  }

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, title')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro) return NextResponse.json({ error: 'no_pro_profile' }, { status: 404 })

  let profile
  try {
    profile = await fetchMidragProfile(parsed.fullUrl)
  } catch (error) {
    trackError(error, { route: 'POST /api/pro/midrag/link.fetch' })
    return NextResponse.json(
      { error: 'fetch_failed', message: 'לא הצלחנו לטעון את הפרופיל ממדרג' },
      { status: 502 },
    )
  }

  if (!profile) {
    return NextResponse.json(
      { error: 'fetch_failed', message: 'לא הצלחנו לטעון את הפרופיל ממדרג' },
      { status: 502 },
    )
  }

  const { error: updateError } = await supabase
    .from('professionals')
    .update({
      midrag_profile_url: parsed.fullUrl,
      midrag_rating: profile.rating,
      midrag_reviews_count: profile.reviews_count,
      midrag_last_synced_at: new Date().toISOString(),
      midrag_verified: true,
    })
    .eq('id', pro.id)

  if (updateError) {
    trackError(updateError, { route: 'POST /api/pro/midrag/link.update' })
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  if (profile.reviews.length > 0) {
    await supabase
      .from('external_reviews')
      .delete()
      .eq('professional_id', pro.id)
      .eq('source', 'midrag')

    const reviews = profile.reviews.map((r) => ({
      professional_id: pro.id,
      source: 'midrag',
      source_url: parsed.fullUrl,
      source_review_id: r.source_review_id,
      rating: r.rating,
      review_text: r.text,
      reviewer_name: r.reviewer_name,
      review_date: r.date,
    }))

    const { error: insertError } = await supabase.from('external_reviews').insert(reviews)
    if (insertError) trackError(insertError, { route: 'POST /api/pro/midrag/link' })
  }

  return NextResponse.json({
    ok: true,
    profile: {
      name: profile.name,
      rating: profile.rating,
      fixly_rating: midragToFixlyRating(profile.rating),
      reviews_count: profile.reviews_count,
      reviews_imported: profile.reviews.length,
    },
  })
}
