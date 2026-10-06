import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { parseJsonBody } from '@/lib/api/parse-body'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { loadSmsRecipients } from '@/lib/sms/prospect-recipients'
import { send019Campaign, sms019Configured, sms019Sender } from '@/lib/sms/019'
import { trackError } from '@/lib/monitoring/track-error'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const schema = z.object({
  id: z.string().uuid(),
  message: z.string().trim().min(1).max(1005),
  snapshot: z.string().regex(/^[a-f0-9]{64}$/),
})
const columns = 'id, message, recipient_count, recipient_snapshot, status, shipment_id, created_at'

export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (id) {
      if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'מזהה לא תקין' }, { status: 400 })
      const { data, error } = await auth.admin.from('prospect_sms_campaigns').select(columns).eq('id', id).maybeSingle()
      if (error) throw error
      return NextResponse.json({ campaign: data }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const { recipients: _phones, ...audience } = await loadSmsRecipients(auth.admin)
    return NextResponse.json({ ...audience, configured: sms019Configured(), sender: sms019Sender() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    trackError(error, { route: 'GET /api/admin/prospects/sms' })
    return NextResponse.json({ error: 'טעינת נתוני SMS נכשלה' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'מקור בקשה לא תקין' }, { status: 403 })
  }
  const parsed = await parseJsonBody(request, schema)
  if (!parsed.success) return parsed.response
  const { id, message, snapshot } = parsed.data
  try {
    const existing = await auth.admin.from('prospect_sms_campaigns').select(columns).eq('id', id).maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data) {
      if (existing.data.message !== message || existing.data.recipient_snapshot !== snapshot) {
        return NextResponse.json({ error: 'מזהה שליחה כבר בשימוש' }, { status: 409 })
      }
      return NextResponse.json({ campaign: existing.data, repeated: true })
    }
    const limited = await enforceRateLimit(request, 'prospect-sms', 3, 60_000)
    if (limited) return limited
    if (!sms019Configured()) return NextResponse.json({ error: 'חיבור 019 עדיין לא הוגדר' }, { status: 503 })
    const audience = await loadSmsRecipients(auth.admin)
    if (audience.snapshot !== snapshot) return NextResponse.json({ error: 'רשימת הנמענים השתנתה. רעננו את הספירה לפני השליחה.' }, { status: 409 })
    if (!audience.count) return NextResponse.json({ error: 'אין מספרי נייד לשליחה' }, { status: 400 })
    const inserted = await auth.admin.from('prospect_sms_campaigns').insert({
      id, message, recipient_snapshot: snapshot, recipient_count: audience.count,
      created_by: auth.user.id,
    })
    if (inserted.error) {
      // Two simultaneous clicks race here; only the unique-key winner submits.
      if (inserted.error.code === '23505') {
        const raced = await auth.admin.from('prospect_sms_campaigns').select(columns).eq('id', id).single()
        if (raced.error) throw raced.error
        return NextResponse.json({ campaign: raced.data, repeated: true })
      }
      throw inserted.error
    }
    const outcome = await send019Campaign(id, message, audience.recipients)
    const { data, error } = await auth.admin.from('prospect_sms_campaigns')
      .update({ status: outcome.status, shipment_id: outcome.shipmentId, completed_at: new Date().toISOString() })
      .eq('id', id).select(columns).single()
    if (error) throw error
    return NextResponse.json({ campaign: data })
  } catch (error) {
    trackError(error, { route: 'POST /api/admin/prospects/sms' })
    return NextResponse.json({ error: 'לא ניתן לאשר את מצב השליחה. בדקו מצב לפני ניסיון נוסף.' }, { status: 500 })
  }
}
