import { NextResponse } from 'next/server'
import {
  clearRateLimit,
  enforceRateLimit,
  getClientIp,
  isPhoneFailureLimited,
  rateLimitResponse,
  recordRateLimitHit,
  waitlistPhoneFailureKey,
} from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { waitlistSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'
import { joinWaitlistProfessions } from '@/lib/waitlist/profession-options'
import { saveWaitlistEntry } from '@/lib/waitlist/save-waitlist-entry'

const WAITLIST_IP_LIMIT = 30
const WAITLIST_IP_WINDOW_MS = 60_000
const WAITLIST_PHONE_FAIL_LIMIT = 3
const WAITLIST_PHONE_FAIL_WINDOW_MS = 10 * 60_000

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

async function recordPhoneFailure(phoneFailKey: string) {
  await recordRateLimitHit(
    phoneFailKey,
    WAITLIST_PHONE_FAIL_LIMIT,
    WAITLIST_PHONE_FAIL_WINDOW_MS,
  )
}

async function handleWaitlist(request: Request, route: string) {
  const limited = await enforceRateLimit(
    request,
    'waitlist',
    WAITLIST_IP_LIMIT,
    WAITLIST_IP_WINDOW_MS,
  )
  if (limited) return limited

  const ip = getClientIp(request)
  let phoneFailKey: string | null = null

  try {
    const parsed = await parseJsonBody(request, waitlistSchema)
    if (!parsed.success) return parsed.response
    const body = parsed.data

    phoneFailKey = waitlistPhoneFailureKey(ip, body.phone)
    const phoneLimited = await isPhoneFailureLimited(
      phoneFailKey,
      WAITLIST_PHONE_FAIL_LIMIT,
      WAITLIST_PHONE_FAIL_WINDOW_MS,
    )
    if (phoneLimited.limited) {
      return rateLimitResponse(phoneLimited.resetAt)
    }

    if (body.audience !== 'professional') {
      await recordPhoneFailure(phoneFailKey)
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
      joinWaitlistProfessions(body.categories, body.otherProfession) ??
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
      await recordPhoneFailure(phoneFailKey)
      return NextResponse.json(
        { error: saved.error, code: errorCodeForSaveStatus(saved.status) },
        { status: saved.status },
      )
    }

    await clearRateLimit(phoneFailKey)

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
    if (phoneFailKey) {
      await recordPhoneFailure(phoneFailKey)
    }
    return NextResponse.json(
      { error: 'שגיאה בשליחת הטופס', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  return handleWaitlist(request, 'POST /api/waitlist')
}
