import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { proWaitlistSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'
import { saveWaitlistEntry } from '@/lib/waitlist/save-waitlist-entry'
import type { WaitlistAudience } from '@/lib/data/pro-waitlist-store'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'pro-waitlist', 10, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, proWaitlistSchema)
    if (!parsed.success) return parsed.response
    const body = parsed.data
    const audience = (body.audience ?? 'professional') as WaitlistAudience

    const saved = await saveWaitlistEntry(
      {
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        category: body.category,
        city: body.city,
        referralCode: body.referralCode ?? undefined,
        audience,
        source: body.source ?? 'pro_join',
      },
      'POST /api/pro/waitlist'
    )

    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 503 })
    }

    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 })
  } catch (error) {
    trackError(error, { route: 'POST /api/pro/waitlist' })
    return NextResponse.json({ error: 'שגיאה בשליחת הטופס' }, { status: 500 })
  }
}
