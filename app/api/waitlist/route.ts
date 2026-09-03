import { NextResponse } from 'next/server'
import { addProWaitlistEntry } from '@/lib/data/pro-waitlist-store'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isSupabaseEnabled } from '@/lib/data/config'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { waitlistSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'

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

async function handleWaitlist(request: Request, route: string) {
  const limited = await enforceRateLimit(request, 'waitlist', 10, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, waitlistSchema)
    if (!parsed.success) return parsed.response
    const body = parsed.data
    const audience = body.audience ?? 'professional'
    const attribution = compactAttribution(body.attribution)

    if (isSupabaseEnabled()) {
      const supabase = await createServerSupabaseClient()
      if (supabase) {
        const baseRow = {
          full_name: body.fullName,
          phone: body.phone,
          email: body.email || null,
          category: body.category ?? null,
          city: body.city ?? null,
          referral_code: body.referralCode ?? null,
          audience,
          source: body.source ?? null,
        }

        const withAttribution = await supabase.from('pro_waitlist').insert({
          ...baseRow,
          ...(attribution ? { attribution } : {}),
        })
        if (!withAttribution.error) {
          return NextResponse.json({ ok: true, audience }, { status: 201 })
        }

        // Older DBs without attribution — retry with audience/source only
        const withAudience = await supabase.from('pro_waitlist').insert(baseRow)
        if (!withAudience.error) {
          return NextResponse.json({ ok: true, audience }, { status: 201 })
        }

        // Legacy schema without audience/source
        const legacy = await supabase.from('pro_waitlist').insert({
          full_name: body.fullName,
          phone: body.phone,
          email: body.email || null,
          category: body.category ?? null,
          city: body.city ?? null,
          referral_code: body.referralCode ?? null,
        })
        if (!legacy.error) {
          return NextResponse.json({ ok: true, audience }, { status: 201 })
        }
        trackError(withAttribution.error, { route })
      }
    }

    addProWaitlistEntry({
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      category: body.category,
      city: body.city,
      referralCode: body.referralCode,
      audience,
      source: body.source,
      attribution: attribution ?? undefined,
    })

    return NextResponse.json({ ok: true, audience }, { status: 201 })
  } catch (error) {
    trackError(error, { route })
    return NextResponse.json({ error: 'שגיאה בשליחת הטופס' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleWaitlist(request, 'POST /api/waitlist')
}
