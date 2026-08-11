import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { publicEnv } from '@/lib/env/public-env'
import { trackError } from '@/lib/monitoring/track-error'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 })
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: 'תשלומים לא מוגדרים' }, { status: 503 })
  }

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, stripe_customer_id, title')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro?.id) {
    return NextResponse.json({ error: 'לא נמצא פרופיל מקצוע' }, { status: 400 })
  }

  try {
    let customerId = pro.stripe_customer_id as string | null

    if (!customerId) {
      const params = new URLSearchParams({
        email: user.email ?? '',
        name: (pro.title as string) || user.email || 'Fixly Pro',
        'metadata[professional_id]': pro.id,
      })

      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!customerRes.ok) {
        const err = await customerRes.text()
        trackError(new Error(err), { route: 'POST /api/billing/portal create-customer' })
        return NextResponse.json({ error: 'שגיאה ביצירת לקוח תשלום' }, { status: 500 })
      }

      const customer = (await customerRes.json()) as { id?: string }
      if (!customer.id) {
        return NextResponse.json({ error: 'שגיאה ביצירת לקוח תשלום' }, { status: 500 })
      }

      customerId = customer.id
      await supabase
        .from('professionals')
        .update({ stripe_customer_id: customerId })
        .eq('id', pro.id)
    }

    const base = publicEnv.appUrl || new URL(request.url).origin
    const portalParams = new URLSearchParams({
      customer: customerId,
      return_url: `${base}/pro/dashboard`,
    })

    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: portalParams.toString(),
    })

    if (!portalRes.ok) {
      const err = await portalRes.text()
      trackError(new Error(err), { route: 'POST /api/billing/portal session' })
      return NextResponse.json({ error: 'שגיאה בפתיחת פורטל החיוב' }, { status: 500 })
    }

    const session = (await portalRes.json()) as { url?: string }
    if (!session.url) {
      return NextResponse.json({ error: 'שגיאה בפתיחת פורטל החיוב' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    trackError(error, { route: 'POST /api/billing/portal' })
    return NextResponse.json({ error: 'שגיאה בפתיחת פורטל החיוב' }, { status: 500 })
  }
}
