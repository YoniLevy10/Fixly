import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { runProspectDiscovery } from '@/lib/prospects/discover'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Daily legal discovery: Google Places + OSM → professional_prospects */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminSupabaseClient()
  if (!admin) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })
  }

  try {
    const result = await runProspectDiscovery(admin, { trigger: 'cron' })
    return NextResponse.json(result, {
      status: result.status === 'failed' ? 500 : 200,
    })
  } catch (error) {
    trackError(error, { route: 'GET /api/cron/discover-prospects' })
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 })
  }
}
