import { NextResponse } from 'next/server'
import { addProWaitlistEntry } from '@/lib/data/pro-waitlist-store'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isSupabaseEnabled } from '@/lib/data/config'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { proWaitlistSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'pro-waitlist', 10, 60_000)
  if (limited) return limited

  try {
    const parsed = await parseJsonBody(request, proWaitlistSchema)
    if (!parsed.success) return parsed.response
    const body = parsed.data

    if (isSupabaseEnabled()) {
      const supabase = await createServerSupabaseClient()
      if (supabase) {
        const { error } = await supabase.from('pro_waitlist').insert({
          full_name: body.fullName,
          phone: body.phone,
          email: body.email || null,
          category: body.category ?? null,
          city: body.city ?? null,
          referral_code: body.referralCode ?? null,
        })
        if (!error) {
          return NextResponse.json({ ok: true }, { status: 201 })
        }
        trackError(error, { route: 'POST /api/pro/waitlist' })
      }
    }

    addProWaitlistEntry({
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      category: body.category,
      city: body.city,
      referralCode: body.referralCode,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    trackError(error, { route: 'POST /api/pro/waitlist' })
    return NextResponse.json({ error: 'שגיאה בשליחת הטופס' }, { status: 500 })
  }
}
