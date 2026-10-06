import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { sheetsWriteConfigured } from '@/lib/integrations/google-sheets'
import { syncOutreachSheet } from '@/lib/prospects/outreach-sheet-sync'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  return NextResponse.json(
    { configured: sheetsWriteConfigured() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  try {
    const result = await syncOutreachSheet(auth.admin, auth.user.id)
    return NextResponse.json(result)
  } catch (error) {
    trackError(error, { route: 'POST /api/admin/prospects/sheet-sync' })
    const message = error instanceof Error ? error.message : 'סנכרון הגיליון נכשל'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
