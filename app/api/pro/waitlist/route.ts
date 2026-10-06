import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { proWaitlistFieldsSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'
import { joinWaitlistProfessions } from '@/lib/waitlist/profession-options'
import { saveWaitlistEntry } from '@/lib/waitlist/save-waitlist-entry'

/**
 * Legacy endpoint for outreach tools. Prefer POST /api/waitlist with
 * audience=professional. Still requires explicit audience in body (or we force it).
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'pro-waitlist', 10, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(
      request,
      proWaitlistFieldsSchema.extend({
        audience: proWaitlistFieldsSchema.shape.audience.optional(),
      }),
    )
    if (!parsed.success) return parsed.response
    const body = parsed.data
    const category =
      joinWaitlistProfessions(body.categories) ??
      body.category?.trim() ??
      undefined

    const saved = await saveWaitlistEntry(
      {
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        category,
        city: body.city,
        referralCode: body.referralCode ?? undefined,
        audience: 'professional',
        source: body.source ?? 'pro_join_api',
        attribution: body.attribution ?? null,
      },
      'POST /api/pro/waitlist'
    )

    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 503 })
    }

    return NextResponse.json(
      { ok: true, audience: 'professional', id: saved.id },
      { status: 201 },
    )
  } catch (error) {
    trackError(error, { route: 'POST /api/pro/waitlist' })
    return NextResponse.json({ error: 'שגיאה בשליחת הטופס' }, { status: 500 })
  }
}
