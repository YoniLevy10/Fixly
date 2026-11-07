import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { waitlistSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'
import { joinWaitlistProfessions } from '@/lib/waitlist/profession-options'
import { saveWaitlistEntry } from '@/lib/waitlist/save-waitlist-entry'

function compactAttribution(
  attribution: Record<string, string | undefined> | undefined
): Record<string, string> | null {
  if (!attribution) return null
  const cleaned: Record<string, string> = {}
  for (const [key, value] of Object.entries(attribution)) {
    if (typeof value === 'string' && value.trim()) cleaned[key] = value.trim()
  }
  return Object.keys(cleaned).length ? cleaned : null
}

function errorCodeForSaveStatus(status: 400 | 503): 'INVALID_INPUT' | 'STORAGE_UNAVAILABLE' {
  return status === 503 ? 'STORAGE_UNAVAILABLE' : 'INVALID_INPUT'
}

async function handleWaitlist(request: Request, route: string) {
  const limited = await enforceRateLimit(request, 'waitlist', 10, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, waitlistSchema)
    if (!parsed.success) return parsed.response
    const body = parsed.data
    if (body.audience !== 'professional') {
      return NextResponse.json(
        {
          error: 'כרגע ההרשמה פתוחה לבעלי מקצוע בלבד',
          code: 'AUDIENCE_CLOSED',
        },
        { status: 400 },
      )
    }
    const attribution = compactAttribution(body.attribution)
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
        source: body.source ?? 'waitlist_landing',
        attribution,
      },
      route
    )

    if (!saved.ok) {
      return NextResponse.json(
        { error: saved.error, code: errorCodeForSaveStatus(saved.status) },
        { status: saved.status },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        audience: body.audience,
        id: saved.id,
        alreadyRegistered: saved.alreadyRegistered,
      },
      { status: saved.alreadyRegistered ? 200 : 201 }
    )
  } catch (error) {
    trackError(error, { route })
    return NextResponse.json(
      { error: 'שגיאה בשליחת הטופס', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  return handleWaitlist(request, 'POST /api/waitlist')
}
