import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { fetchMidragProfile } from '@/lib/integrations/midrag/scraper'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'

/** GET /api/cron/sync-midrag — daily sync of linked Midrag profiles */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = getAdminSupabaseClient()
  if (!admin) return NextResponse.json({ error: 'no_admin' }, { status: 500 })

  const { data: pros, error } = await admin
    .from('professionals')
    .select('id, midrag_profile_url')
    .not('midrag_profile_url', 'is', null)

  if (error) {
    trackError(error, { route: 'GET /api/cron/sync-midrag' })
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  if (!pros || pros.length === 0) return NextResponse.json({ ok: true, synced: 0 })

  let synced = 0
  let failed = 0

  for (const pro of pros) {
    try {
      const url = pro.midrag_profile_url as string
      const profile = await fetchMidragProfile(url)
      if (!profile) {
        failed++
        continue
      }

      await admin
        .from('professionals')
        .update({
          midrag_rating: profile.rating,
          midrag_reviews_count: profile.reviews_count,
          midrag_last_synced_at: new Date().toISOString(),
        })
        .eq('id', pro.id)

      await admin
        .from('external_reviews')
        .delete()
        .eq('professional_id', pro.id)
        .eq('source', 'midrag')

      if (profile.reviews.length > 0) {
        await admin.from('external_reviews').insert(
          profile.reviews.map((r) => ({
            professional_id: pro.id,
            source: 'midrag',
            source_url: url,
            source_review_id: r.source_review_id,
            rating: r.rating,
            review_text: r.text,
            reviewer_name: r.reviewer_name,
            review_date: r.date,
          })),
        )
      }

      synced++
      await new Promise((r) => setTimeout(r, 2000))
    } catch (err) {
      failed++
      trackError(err, { route: 'GET /api/cron/sync-midrag.pro', professionalId: pro.id })
    }
  }

  return NextResponse.json({ ok: true, synced, failed, total: pros.length })
}
