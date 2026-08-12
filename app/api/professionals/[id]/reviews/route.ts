import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/professionals/:id/reviews — Fixly + Midrag reviews in a unified shape */
export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'supabase_unavailable' }, { status: 503 })
  }

  const { id } = await context.params

  try {
    const { data: fixlyReviews, error: fixlyError } = await supabase
      .from('reviews')
      .select('id, rating, text, created_at')
      .eq('professional_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (fixlyError) throw fixlyError

    const { data: externalReviews, error: externalError } = await supabase
      .from('external_reviews')
      .select('id, source, rating, review_text, reviewer_name, review_date, source_url')
      .eq('professional_id', id)
      .order('review_date', { ascending: false })
      .limit(50)

    if (externalError) throw externalError

    const allReviews = [
      ...(fixlyReviews ?? []).map((r) => ({
        id: r.id,
        source: 'fixly' as const,
        rating: r.rating,
        text: r.text,
        date: r.created_at,
        reviewer: null as string | null,
      })),
      ...(externalReviews ?? []).map((r) => ({
        id: r.id,
        source: r.source as string,
        rating: Number(r.rating) / 2, // 1-10 → 0.5-5
        text: r.review_text,
        date: r.review_date,
        reviewer: r.reviewer_name as string | null,
        source_url: r.source_url as string | null,
      })),
    ]

    return NextResponse.json({ ok: true, reviews: allReviews })
  } catch (error) {
    trackError(error, { route: 'GET /api/professionals/[id]/reviews' })
    return NextResponse.json({ ok: false, error: 'reviews_failed' }, { status: 500 })
  }
}
