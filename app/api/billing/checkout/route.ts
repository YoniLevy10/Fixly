import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createProSubscriptionCheckout } from '@/lib/stripe/checkout'
import { publicEnv } from '@/lib/env/public-env'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { parseJsonBody } from '@/lib/api/parse-body'
import { billingCheckoutSchema } from '@/lib/api/schemas'
import { trackError } from '@/lib/monitoring/track-error'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'billing-checkout', 10, 60_000)
  if (limited) return limited

  const contentLength = request.headers.get('content-length')
  if (contentLength && contentLength !== '0') {
    const parsed = await parseJsonBody(request, billingCheckoutSchema)
    if (!parsed.success) return parsed.response
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 })
  }

  const { data: pro } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro?.id) {
    return NextResponse.json(
      { error: 'יש לקשר פרופיל מקצוע לפני רכישת מנוי' },
      { status: 400 }
    )
  }

  try {
    const base = publicEnv.appUrl || new URL(request.url).origin
    const result = await createProSubscriptionCheckout(
      pro.id,
      `${base}/pro/pricing?success=1`,
      `${base}/pro/pricing?canceled=1`,
    )

    if (!result.configured) {
      return NextResponse.json({
        configured: false,
        message: result.message,
      })
    }

    return NextResponse.json({ configured: true, url: result.url })
  } catch (error) {
    trackError(error, { route: 'POST /api/billing/checkout' })
    return NextResponse.json({ error: 'שגיאה ביצירת תשלום' }, { status: 500 })
  }
}
