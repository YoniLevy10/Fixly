import { NextResponse } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { syncOutreachSheet } from '@/lib/prospects/outreach-sheet-sync'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
    return NextResponse.json(result)
  } catch (error) {
    trackError(error, { route: 'GET /api/cron/sync-outreach-sheet' })
    const message = error instanceof Error ? error.message : 'סנכרון הגיליון נכשל'
    return NextResponse.json({ ok: false, error: message })
  }
}
