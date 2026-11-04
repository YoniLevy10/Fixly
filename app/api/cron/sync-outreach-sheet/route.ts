import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { syncOutreachSheet } from '@/lib/prospects/outreach-sheet-sync'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
/**
 * Ceiling above the helper budget (40s, at most 20 row mutations).
 * Pro Fluid allows 800s; 90s still returns before the old 60s kill if a
 * Google call uses its 8s timeout. Default platform duration is 300s.
 */
export const maxDuration = 90

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
    const result = await syncOutreachSheet(admin, null)
    console.info('[cron sync-outreach-sheet]', {
      busy: result.busy === true,
      partial: result.partial === true,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      processed: result.processed ?? 0,
      remaining: result.remaining ?? 0,
      deferred: result.deferred ?? 0,
      wroteSheet: result.wroteSheet,
      configured: result.configured,
      errorCount: result.errors.length,
    })
    return NextResponse.json(result)
  } catch (error) {
    trackError(error, { route: 'GET /api/cron/sync-outreach-sheet' })
    const message = error instanceof Error ? error.message : 'סנכרון הגיליון נכשל'
    return NextResponse.json({ ok: false, error: message })
  }
}
